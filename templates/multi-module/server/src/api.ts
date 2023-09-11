import { Parser } from 'cast.ts'
import debug from 'debug'
import { Router, Request, Response, Application } from 'express'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { genTsType } from 'gen-ts-type'
import { dirname, join } from 'path'
import { parseTsType } from 'ts-type-check'
import { env } from './env'
import { HttpError } from './error'
import { checkAdmin, getJWT, JWTPayload } from './jwt'
import { proxy } from './proxy'

function saveConfig(options: { file: string }) {
  let code = `
// This file is generated automatically
// Don't edit this file directly

export let server_origin = '${env.ORIGIN}'
`
  saveFile({ file: options.file, code })
}

export function defModule(options: { apiPrefix?: string; name: string }) {
  let log = debug('api')
  log.enabled = true

  let router = Router()
  let apiPrefix = options?.apiPrefix || `/api/${options.name}`

  let code = `
// This file is generated automatically
// Don't edit this file directly

import { post } from './utils'

let api_origin = '${apiPrefix}'
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
	return post(api_origin + '/${name}', body, token)
}
`
    } else {
      code += `
export function ${name}(input: ${Name}Input): Promise<${Name}Output & { error?: string }> {
	return post(api_origin + '/${name}', input)
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

  function saveClient() {
    let dir = join('..', 'client', 'src', 'api')
    saveConfig({
      file: join(dir, 'config.ts'),
    })
    saveFile({
      file: join(dir, options.name + '.ts'),
      code,
    })
  }

  return {
    defAPI,
    saveClient,
    apiPrefix,
    router,
  }
}

function saveFile(options: { code: string; file: string }) {
  let { file, code } = options
  code = code.trim() + '\n'
  try {
    let content = readFileSync(file).toString()
    if (content == code) return
  } catch (error) {
    // e.g. file not exist
  }
  writeFileSync(file, code)
  console.log('saved to', file)
}
