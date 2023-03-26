import { Router } from 'express'
import { writeFileSync } from 'fs'
import { genTsType } from 'gen-ts-type'
import { EOL } from 'os'
import { env } from './env'
export let apiRouter = Router()

export let apiPrefix = '/api'

let code = `
let api_origin = '${env.ORIGIN}${apiPrefix}'

function post(url: string, body: object) {
  return fetch(api_origin + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .catch(err => ({ error: String(err) }))
}
`

function defAPI<Input, Output>(input: {
  name: string
  sampleInput: Input
  sampleOutput: Output
  fn: (input: Input) => Output | Promise<Output>
}) {
  let name = input.name
  let Name = name[0].toUpperCase() + name.slice(1)
  let Input = genTsType(input.sampleInput, { format: true })
  let Output = genTsType(input.sampleOutput, { format: true })
  code += `
export type ${Name}Input = ${Input}
export type ${Name}Output = ${Output}
export function ${name}(input: ${Name}Input): Promise<${Name}Output> {
	return post('/${name}', input)
}
`
  apiRouter.post('/' + name, async (req, res) => {
    try {
      let json = await input.fn(req.body)
      res.json(json)
    } catch (error: any) {
      let statusCode = error.statusCode || 500
      res.status(statusCode)
      res.json({ error: String(error) })
    }
  })
}

function saveSDK() {
  let file = '../client/src/sdk.ts'
  writeFileSync(file, code.trim() + EOL)
  console.log('saved to', file)
}

defAPI({
  name: 'createUser',
  sampleInput: {
    username: 'alice',
    password: 'secret',
  },
  sampleOutput: { id: 1 },
  fn: input => {
    return { id: 1 }
  },
})

saveSDK()
