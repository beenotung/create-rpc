import { Parser } from 'cast.ts'
import debug from 'debug'
import { Router, Request, Response } from 'express'
import { writeFileSync } from 'fs'
import { genTsType } from 'gen-ts-type'
import { join } from 'path'
import { parseTsType } from 'ts-type-check'
import { env } from './env'
import { checkAdmin, getJWT, JWTPayload } from './jwt'
import { proxy } from './proxy'

export function defModule(options?: { apiPrefix?: string }) {
  let log = debug('api')
  log.enabled = true

  let router = Router()
  let apiPrefix = options?.apiPrefix || '/api'

  let code = `
// This file is generated automatically
// Don't edit this file directly

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
    body: JSON.stringify(body),
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
    api: {
      name: string
      sampleInput?: Input
      sampleOutput?: Output
      inputParser?: Parser<Input>
      outputParser?: Parser<Output>
    } & (
      | {
          jwt: true
          role?: 'admin'
          fn?: (input: Input, jwt: JWTPayload) => Output | Promise<Output>
        }
      | {
          jwt?: false
          fn?: (input: Input) => Output | Promise<Output>
        }
    ),
  ) {
    let name = api.name
    let Name = name[0].toUpperCase() + name.slice(1)
    let InputType =
      api.inputParser?.type ??
      genTsType(api.sampleInput ?? {}, { format: true, semi: false })
    let OutputType =
      api.outputParser?.type ??
      genTsType(api.sampleOutput ?? {}, { format: true, semi: false })
    code += `
export type ${Name}Input = ${InputType}
export type ${Name}Output = ${OutputType}`
    if (api.jwt) {
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

    const inputParser = api.inputParser
    let parseInput: (body: unknown) => Input
    if (inputParser) {
      parseInput = body => inputParser.parse(body, { name: 'req.body' })
    } else {
      const typeChecker = parseTsType(InputType)
      parseInput = body => {
        typeChecker.check(body)
        return body as Input
      }
    }

    const outputParser = api.outputParser
    let parseOutput: (json: Output) => Output
    if (outputParser) {
      parseOutput = json => outputParser.parse(json, { name: 'res.body' })
    } else {
      const typeChecker = parseTsType(OutputType)
      parseOutput = json => {
        typeChecker.check(json)
        return json
      }
    }

    function getSampleInput() {
      return (
        api.sampleInput ??
        api.inputParser?.sampleValue ??
        api.inputParser?.randomSample()
      )
    }

    function getSampleOutput() {
      return (
        api.sampleOutput ??
        api.outputParser?.sampleValue ??
        api.outputParser?.randomSample()
      )
    }

    let requestHandler = async (req: Request, res: Response) => {
      log(name, req.body)
      let startTime = Date.now()
      let json: Output | { error: string }
      let user_id: number | null = null
      try {
        let body = parseInput(req.body)
        if (!api.fn) {
          res.status(501)
          res.json(getSampleOutput())
          return
        }
        if (api.jwt) {
          let jwt = getJWT(req)
          if (api.role == 'admin') checkAdmin(jwt)
          user_id = jwt.id
          json = await api.fn(body, jwt)
        } else {
          json = await api.fn(body)
        }
        json = parseOutput(json)
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
    }
    router.post('/' + name, requestHandler)

    return {
      ...api,
      parseInput,
      parseOutput,
      requestHandler,
      inputType: InputType,
      outputType: OutputType,
      getSampleInput,
      getSampleOutput,
    }
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
