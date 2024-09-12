import { Parser, inferFromSampleValue, object, InferType } from 'cast.ts'
import debug from 'debug'
import { Router, Request, Response } from 'express'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { env } from './env'
import { checkAdmin, getJWT, JWTPayload } from './jwt'
import { proxy } from './proxy'
import { HttpError } from './error'

const emptyParser = object({})

type Result<T> = T | Promise<T>

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
      inputParser?: Parser<InferType<Input>>
      outputParser?: Parser<InferType<Output>>
    } & (
      | {
          jwt: true
          role?: 'admin'
          fn?: (
            input: InferType<Input>,
            jwt: JWTPayload,
          ) => Result<InferType<Output>>
        }
      | {
          jwt?: false
          fn?: (input: InferType<Input>) => Result<InferType<Output>>
        }
    ),
  ) {
    let name = api.name
    let Name = name[0].toUpperCase() + name.slice(1)

    const inputParser = (api?.inputParser ||
      (api?.sampleInput
        ? inferFromSampleValue(api.sampleInput)
        : emptyParser)) as Parser<InferType<Input>>

    const outputParser = (api?.outputParser ||
      (api?.sampleOutput
        ? inferFromSampleValue(api.sampleOutput)
        : emptyParser)) as Parser<InferType<Output>>

    const InputType = inputParser.type
    const OutputType = outputParser.type

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
      let input: InferType<Input> | undefined
      let output: InferType<Output> | { error: string }
      let user_id: number | null = null
      try {
        input = inputParser.parse(req.body)
        if (!api.fn) {
          res.status(501)
          res.json(getSampleOutput())
          return
        }
        if (api.jwt) {
          let jwt = getJWT(req)
          if (api.role == 'admin') checkAdmin(jwt)
          user_id = jwt.id
          output = await api.fn(input, jwt)
        } else {
          output = await api.fn(input)
        }
        output = outputParser.parse(output)
      } catch (e: any) {
        let err = e as HttpError
        if (!err.statusCode) console.error(err)
        res.status(err.statusCode || 500)
        let error = String(err).replace(/^(\w*)Error: /, '')
        output = { error }
      }
      let endTime = Date.now()
      res.json(output)
      if (!input) {
        input = req.body
      }
      proxy.log.push({
        rpc: name,
        input: JSON.stringify(input),
        output: JSON.stringify(output),
        time_used: endTime - startTime,
        user_id,
        user_agent: req.headers['user-agent'] || null,
      })
    }
    router.post('/' + name, requestHandler)

    return {
      ...api,
      requestHandler,
      inputParser,
      outputParser,
      getSampleInput,
      getSampleOutput,
    }
  }

  function saveSDK() {
    if (env.NODE_ENV != 'development') return
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
