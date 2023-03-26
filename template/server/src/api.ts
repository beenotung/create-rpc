import { Router } from 'express'
import { writeFileSync } from 'fs'
import { genTsType } from 'gen-ts-type'
import { env } from './env'
import debug from 'debug'
import { JWTPayload, getJWT } from './jwt'

let log = debug('api')
log.enabled = true

export let apiRouter = Router()

export let apiPrefix = '/api'

let code = `
let api_origin = '${env.ORIGIN}${apiPrefix}'

let token = localStorage.getItem('token')

export function clearToken() {
  token = null
  localStorage.removeItem('token')
}

function post(url: string, body: object) {
  return fetch(api_origin + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
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
        localStorage.setItem('token', token)
      }
      return json
    })
}
`

export function defAPI<Input, Output>(
  input: {
    name: string
    sampleInput: Input
    sampleOutput: Output
  } & (
    | {
        jwt: true
        fn: (input: Input, jwt: JWTPayload) => Output | Promise<Output>
      }
    | {
        jwt?: false
        fn: (input: Input) => Output | Promise<Output>
      }
  ),
) {
  let name = input.name
  let Name = name[0].toUpperCase() + name.slice(1)
  let Input = genTsType(input.sampleInput, { format: true })
  let Output = genTsType(input.sampleOutput, { format: true })
  code += `
export type ${Name}Input = ${Input}
export type ${Name}Output = ${Output}
export function ${name}(input: ${Name}Input): Promise<${Name}Output & { error?: string }> {
	return post('/${name}', input)
}
`
  apiRouter.post('/' + name, async (req, res) => {
    log(name, req.body)
    try {
      let json = input.jwt
        ? await input.fn(req.body, getJWT(req))
        : await input.fn(req.body)
      res.json(json)
    } catch (error: any) {
      let statusCode = error.statusCode || 500
      res.status(statusCode)
      res.json({ error: String(error) })
    }
  })
}

export function saveSDK() {
  let content = code.trim() + '\n'
  let file = '../client/src/sdk.ts'
  writeFileSync(file, content)
  console.log('saved to', file)
}
