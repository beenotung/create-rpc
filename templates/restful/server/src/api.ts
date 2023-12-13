import { Parser } from 'cast.ts'
import { RouteParameters } from 'express-serve-static-core'
import { NextFunction, Request, Response, Router } from 'express'
import { writeFileSync } from 'fs'
import { env } from './env'
import { genTsType } from 'gen-ts-type'
import debug from 'debug'
import { HttpError } from './http.error'
import { parseTsType } from 'ts-type-check'
import { proxy } from './proxy'
import { JWTPayload, checkAdmin, getJWT } from './jwt'

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export function hasBody(method: Method): boolean {
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

export function defModule(options: { name?: string; apiPrefix?: string }) {
  let name = options.name || 'api'

  let log = debug(name)
  log.enabled = true

  let router = Router()
  let apiPrefix = options.apiPrefix ?? '/api'

  let file = `../client/src/sdk/${name}.ts`

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
    let name = api?.name
      ? api.name
      : method.toLowerCase() +
        url
          .split('/')
          .filter(s => s && s[0] != ':')
          .map(s => s[0].toUpperCase() + s.substring(1))
          .join('')
    let Name = name[0].toUpperCase() + name.substring(1)
    let InputType =
      api?.inputParser?.type ??
      genTsType(api?.sampleInput ?? {}, { format: true, semi: false })
    let OutputType =
      api?.outputParser?.type ??
      genTsType(api?.sampleOutput ?? {}, { format: true, semi: false })

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

    let isHasBody = hasBody(method)
    if (isHasBody) {
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

    const inputParser = api?.inputParser
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

    const outputParser = api?.outputParser
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
      let json: Output | { error: string }
      let startTime = Date.now()
      let input = req as object
      let user_id: number | null = null
      try {
        input = parseInput(input)
        log(name, input)
        if (!api?.fn) {
          res.status(501)
          res.json(getSampleOutput())
          return
        }
        if (api.jwt) {
          let jwt = getJWT(req)
          if (api.role == 'admin') checkAdmin(jwt)
          user_id = jwt.id
          json = await api.fn(input as Input, jwt)
        } else {
          json = await api.fn(input as Input)
        }
      } catch (error: any) {
        let statusCode = error.statusCode || 500
        res.status(statusCode)
        json = { error: String(error) }
      }
      let endTime = Date.now()
      res.json(json)
      proxy.log.push({
        method,
        url,
        input: JSON.stringify(req.body),
        output: JSON.stringify(json),
        time_used: endTime - startTime,
        user_id,
        user_agent: req.headers['user-agent'] || null,
      })
    }

    router[method.toLowerCase() as 'post'](url, requestHandler)
  }

  function saveSDK() {
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
