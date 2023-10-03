import { Parser } from 'cast.ts'
import { RouteParameters } from 'express-serve-static-core'
import { NextFunction, Request, Response, Router } from 'express'
import { writeFileSync } from 'fs'
import { env } from './env'
import { genTsType } from 'gen-ts-type'
import debug from 'debug'
import { HttpError } from './http.error'
import { parseTsType } from 'ts-type-check'

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
  let { name: service } = options

  let log = debug('api')
  log.enabled = true

  let router = Router()
  let apiPrefix = options.apiPrefix ?? '/api'

  let file = `../client/src/sdk/${service}.ts`

  let code = `
// This file is generated automatically
// Don't edit this file directly

export let server_origin = '${env.ORIGIN}'

export let api_origin = server_origin + '${apiPrefix}/${service}'

export function getToken() {
  return localStorage.getItem('token')
}

function call(method: string, href: string, body?: object) {
  let url = api_origin + href
  let init: RequestInit = {
    method,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + getToken(),
    }
  }
  if (body) {
    init.headers!['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  return fetch(url, init)
    .then(res => res.json())
    .catch(e => ({error: String(e)}))
    .then(json => json.error ? Promise.reject(json.error) : json)
}

function toParams(input: Record<string, any>) {
  let params = new URLSearchParams()
  for (let key in input) {
    let value = input[key]
    if (Array.isArray(value)) {
      for (let val of value) {
        params.append(key, val)
      }
    } else {
      params.set(key, value)
    }
  }
  return params
}
`

  function defAPI<Path extends string, Input = {}, Output = {}>(
    method: Method,
    url: Path,
    api?: {
      name?: string
      sampleInput?: Input
      sampleOutput?: Output
      inputParser?: Parser<Input>
      outputParser?: Parser<Output>
      fn?: (input: Input) => Output | Promise<Output>
    },
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

    let restKeys = Object.keys(
      api?.sampleInput ?? api?.inputParser?.sampleValue ?? {},
    ).filter(key => !params.includes(key))

    params.forEach(s => {
      href = href.replace(':' + s, '${' + s + '}')
    })

    let bodyCode = ``
    let rest: string

    if (params.length > 0) {
      bodyCode += `
  let { ${params.join(', ')}, ...rest } = input`
      rest = 'rest'
    } else {
      rest = 'input'
    }

    let isHasBody = hasBody(method)
    if (isHasBody) {
      bodyCode += `
  return call('${method}', \`${href}\`, ${rest})`
    } else {
      bodyCode += `
  return call('${method}', \`${href}?\` + toParams(${rest}))`
    }

    code += `
// ${method} ${url}
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
      try {
        let input = {
          ...req.params,
          ...req.query,
          ...req.body,
        }
        input = parseInput(input)
        log(name, input)
        if (!api?.fn) {
          res.status(501)
          res.json(getSampleOutput())
          return
        }
        json = await api.fn(input)
      } catch (error: any) {
        let statusCode = error.statusCode || 500
        res.status(statusCode)
        json = { error: String(error) }
      }
      res.json(json)
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
