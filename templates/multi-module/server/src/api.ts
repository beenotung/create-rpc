import { InferType, Parser, inferFromSampleValue, object } from 'cast.ts'
import debug from 'debug'
import { Router, Request, Response } from 'express'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
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

const emptyParser = object({})

type Result<T> = T | Promise<T>

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
      inputParser?: Parser<InferType<Input>>
      outputParser?: Parser<InferType<Output>>
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
          fn?: (input: InferType<Input>) => Result<InferType<NoInfer<Output>>>
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

  function saveClient() {
    if (env.NODE_ENV != 'development') return
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
