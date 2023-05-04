import { Parser } from 'cast.ts'
import debug from 'debug'
import { Router } from 'express'
import { writeFileSync } from 'fs'
import { genTsType } from 'gen-ts-type'
import { join } from 'path'
import { checkTsType } from 'ts-type-check'
import { env } from './env'
import { getJWT, JWTPayload } from './jwt'
import { proxy } from './proxy'

export function defModule(options?: { apiPrefix?: string }) {
  let log = debug('api')
  log.enabled = true

  let router = Router()
  let apiPrefix = options?.apiPrefix || '/api'

  let code = `
export let server_origin = '${env.ORIGIN}'

let api_origin = '${env.ORIGIN}${apiPrefix}'

let store = typeof window == 'undefined' ? null : localStorage

let token = store?.getItem('token')

export function getToken() {
  return token
}

export function clearToken() {
  token = null
  store?.removeItem('token')
}

function post(url: string, body: object, token_?: string) {
  return fetch(api_origin + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token_,
    },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .catch(err => ({ error: String(err) }))
    .then(json => {
      if (json.error) {
        return Promise.reject(json.error)
      }
      if (json.token) {
        token = json.token as string
        store?.setItem('token', token)
      }
      return json
    })
}
`

  function defAPI<Input, Output>(
    input: {
      name: string
      sampleInput?: Input
      sampleOutput?: Output
      inputParser?: Parser<Input>
      outputParser?: Parser<Output>
    } & (
      | {
          jwt: true
          fn?: (input: Input, jwt: JWTPayload) => Output | Promise<Output>
        }
      | {
          jwt?: false
          fn?: (input: Input) => Output | Promise<Output>
        }
    ),
  ) {
    let name = input.name
    let Name = name[0].toUpperCase() + name.slice(1)
    let InputType =
      input.inputParser?.type ??
      genTsType(input.sampleInput ?? {}, { format: true, semi: false })
    let OutputType =
      input.outputParser?.type ??
      genTsType(input.sampleOutput ?? {}, { format: true, semi: false })
    code += `
export type ${Name}Input = ${InputType}
export type ${Name}Output = ${OutputType}`
    if (input.jwt) {
      code += `
export function ${name}(input: ${Name}Input & { token: string }): Promise<${Name}Output & { error?: string }> {
  let { token, ...body } = input
	return post('/${name}', body, token)
}
`
    } else {
      code += `
export function ${name}(input: ${Name}Input): Promise<${Name}Output & { error?: string }> {
	return post('/${name}', input)
}
`
    }
    router.post('/' + name, async (req, res) => {
      log(name, req.body)
      let startTime = Date.now()
      let json: Output | { error: string }
      let user_id: number | null = null
      try {
        if (input.inputParser) {
          req.body = input.inputParser.parse(req.body, { name: 'req.body' })
        } else {
          checkTsType(InputType, req.body)
        }
        if (!input.fn) {
          res.status(501)
          res.json(
            input.sampleOutput ??
              input.outputParser?.sampleValue ??
              input.outputParser?.randomSample(),
          )
          return
        }
        if (input.jwt) {
          let jwt = getJWT(req)
          user_id = jwt.id
          json = await input.fn(req.body, jwt)
        } else {
          json = await input.fn(req.body)
        }
        if (input.outputParser) {
          json = input.outputParser.parse(json, { name: 'res.body' })
        } else {
          checkTsType(OutputType, json)
        }
      } catch (error: any) {
        let statusCode = error.statusCode || 500
        res.status(statusCode)
        json = { error: String(error) }
      }
      let endTime = Date.now()
      res.json(json)
      proxy.log.push({
        rpc: name,
        input: JSON.stringify(req.body),
        output: JSON.stringify(json),
        time_used: endTime - startTime,
        user_id,
        user_agent: req.headers['user-agent'] || null,
      })
    })
  }

  function saveSDK() {
    let content = code.trim() + '\n'
    let file = join('..', 'client', 'src', 'sdk.ts')
    writeFileSync(file, content)
    console.log('saved to', file)
  }

  return {
    defAPI,
    saveSDK,
    apiPrefix,
    router,
  }
}
