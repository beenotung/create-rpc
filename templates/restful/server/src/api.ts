import { InferType, Parser, inferFromSampleValue, object } from 'cast.ts'
import { NextFunction, Request, Response, Router } from 'express'
import { writeFileSync } from 'fs'
import debug from 'debug'
import { HttpError } from './http.error'
import { proxy } from './proxy'
import { JWTPayload, checkAdmin, getJWT } from './jwt'
import { env } from './env'

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export function canMethodHasBody(method: Method): boolean {
  switch (method) {
    case 'GET':
    case 'DELETE':
      return false
    case 'POST':
    case 'PATCH':
    case 'PUT':
      return true
  }
}

const emptyInputParser = object({
  headers: object({}),
  params: object({}),
  query: object({}),
  body: object({}),
})

const emptyOutputParser = object({})

type Result<T> = T | Promise<T>

export function defModule(options: { name?: string; apiPrefix?: string }) {
  let moduleName = options.name || 'api'

  let log = debug(moduleName)
  log.enabled = true

  let router = Router()
  let apiPrefix = options.apiPrefix ?? '/api'

  let file = `../client/src/api/${moduleName}.ts`

  let code = `
// This file is generated automatically
// Don't edit this file directly

import { call, toParams } from './utils'

export let api_origin = '${apiPrefix}'
`

  function defAPI<
    Path extends string,
    Input extends {
      headers?: object
      params?: object
      query?: object
      body?: object
    },
    Output,
  >(
    method: Method,
    url: Path,
    api?: {
      name?: string
      sampleInput?: Input
      sampleOutput?: Output
      inputParser?: Parser<InferType<Input>>
      outputParser?: Parser<InferType<Output>>
      transformInputForLog?: (input: Partial<InferType<Input>>) => unknown
      transformOutputForLog?: (output: Partial<InferType<Output>>) => unknown
    } & (
      | {
          jwt: true
          role?: 'admin'
          fn?: (
            input: InferType<Input>,
            jwt: JWTPayload,
          ) => Result<InferType<NoInfer<Output>>>
        }
      | {
          jwt?: false
          fn?: (
            input: InferType<Input>,
            jwt: JWTPayload | null,
          ) => Result<InferType<NoInfer<Output>>>
        }
    ),
  ) {
    let name = api?.name
      ? api.name
      : method.toLowerCase() +
        url
          .split('/')
          .filter(s => s && s[0] != ':')
          .map(s => s[0].toUpperCase() + s.substring(1))
          .join('')
    let Name = name[0].toUpperCase() + name.substring(1)

    const inputParser = (api?.inputParser ||
      (api?.sampleInput
        ? inferFromSampleValue(api.sampleInput)
        : emptyInputParser)) as Parser<InferType<Input>>

    const outputParser = (api?.outputParser ||
      (api?.sampleOutput
        ? inferFromSampleValue(api.sampleOutput)
        : emptyOutputParser)) as Parser<InferType<Output>>

    const InputType = inputParser.type
    const OutputType = outputParser.type

    let href: string = url

    let params = url
      .split('/')
      .filter(s => s[0] == ':')
      .map(s => s.substring(1))

    let bodyCode = ``

    if (params.length > 0) {
      bodyCode += `
  let { params } = input`
      for (let param of params) {
        href = href.replace(':' + param, '${params.' + param + '}')
      }
    }

    let hasQuery = InputType.includes('\n  query: {\n')
    if (hasQuery) {
      href = '`' + href + '?` + toParams(input.query)'
    } else {
      href = '`' + href + '`'
    }

    let hasBody = InputType.includes('body:')
    if (hasBody && !canMethodHasBody(method)) {
      console.warn(
        `Warning: HTTP method ${method} cannot have body but used in module: ${moduleName}, api: ${name}`,
      )
    }
    if (hasBody) {
      bodyCode += `
  return call('${method}', api_origin + ${href}, input.body)`
    } else {
      bodyCode += `
  return call('${method}', api_origin + ${href})`
    }

    code += `
// ${method} ${apiPrefix}${url}
export function ${name}(input: ${Name}Input): Promise<${Name}Output & { error?: string }> {
  ${bodyCode.trim()}
}
export type ${Name}Input = ${InputType}
export type ${Name}Output = ${OutputType}
`

    function getSampleInput() {
      return (
        api?.sampleInput ??
        api?.inputParser?.sampleValue ??
        api?.inputParser?.randomSample()
      )
    }

    function getSampleOutput() {
      return (
        api?.sampleOutput ??
        api?.outputParser?.sampleValue ??
        api?.outputParser?.randomSample()
      )
    }

    let requestHandler = async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      let startTime = Date.now()
      let input: InferType<Input> | undefined
      let output: InferType<Output> | { error: string }
      let jwt: JWTPayload | null = null
      try {
        input = inputParser.parse(req)
        log(
          name,
          api?.transformInputForLog ? api.transformInputForLog(input) : input,
        )
        if (!api?.fn) {
          res.status(501)
          res.json(getSampleOutput())
          return
        }
        if (api.jwt) {
          jwt = getJWT(req)
          if (api.role == 'admin') checkAdmin(jwt)
          output = await api.fn(input, jwt)
        } else {
          try {
            jwt = getJWT(req)
          } catch (error) {
            // api from guest
          }
          output = await api.fn(input, jwt)
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
        input = {
          headers: req.headers,
          params: req.params,
          query: req.query,
          body: req.body,
        } as InferType<Input>
      }
      proxy.log.push({
        method,
        url,
        input: JSON.stringify(
          api?.transformInputForLog ? api.transformInputForLog(input) : input,
        ),
        output: JSON.stringify(
          api?.transformOutputForLog &&
            output &&
            typeof output == 'object' &&
            !('error' in output)
            ? api.transformOutputForLog(output)
            : output,
        ),
        time_used: endTime - startTime,
        user_id: jwt ? jwt.id : null,
        user_agent: req.headers['user-agent'] || null,
      })
    }

    router[method.toLowerCase() as 'post'](url, requestHandler)

    return {
      method,
      url,
      ...api,
      name,
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
