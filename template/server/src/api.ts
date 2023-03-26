import { find } from 'better-sqlite3-proxy'
import { Router } from 'express'
import { writeFileSync } from 'fs'
import { genTsType } from 'gen-ts-type'
import { EOL } from 'os'
import { db } from './db'
import { env } from './env'
import { HTTPError } from './error'
import { comparePassword, hashPassword } from './hash'
import { decodeJWT, encodeJWT } from './jwt'
import { proxy } from './proxy'
export let apiRouter = Router()
import debug from 'debug'

let log = debug('api')
log.enabled = true

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
    .then(json => json.error ? Promise.reject(json) : json)
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
export function ${name}(input: ${Name}Input): Promise<${Name}Output & { error?: string }> {
	return post('/${name}', input)
}
`
  apiRouter.post('/' + name, async (req, res) => {
    log(name, req.body)
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
  name: 'signup',
  sampleInput: {
    username: 'alice',
    password: 'secret',
  },
  sampleOutput: { token: 'jwt' },
  fn: async input => {
    let user = find(proxy.user, { username: input.username })
    if (user) throw new HTTPError(409, 'this username is already in use')
    let id = proxy.user.push({
      username: input.username,
      password_hash: await hashPassword(input.password),
    })
    let token = encodeJWT({ id })
    return { token }
  },
})

defAPI({
  name: 'signin',
  sampleInput: {
    username: 'alice',
    password: 'secret',
  },
  sampleOutput: { token: 'jwt' },
  async fn(input) {
    let user = find(proxy.user, { username: input.username })
    if (!user) throw new HTTPError(404, 'this username is not used')
    let matched = await comparePassword({
      password: input.password,
      password_hash: user.password_hash,
    })
    if (!matched) throw new HTTPError(401, 'wrong username or password')
    let token = encodeJWT({ id: user.id! })
    return { token }
  },
})

defAPI({
  name: 'createPost',
  sampleInput: { token: 'jwt', content: 'hello world' },
  sampleOutput: { id: 1 },
  fn(input) {
    let user_id = decodeJWT(input.token).id
    let id = proxy.post.push({ user_id, content: input.content })
    return { id }
  },
})

let select_post_list = db.prepare(/* sql */ `
select
  post.id
, post.user_id
, user.username
, post.content
from post
inner join user on user.id = post.user_id
where content like :keyword
  and post.id > :last_post_id
order by post.id asc
limit :limit
`)
defAPI({
  name: 'getPostList',
  sampleInput: { limit: 5, last_post_id: 0, keyword: 'hello' },
  sampleOutput: {
    posts: [{ id: 1, user_id: 1, username: 'alice', content: 'hello world' }],
  },
  fn(input) {
    let posts = select_post_list.all({
      keyword: '%' + input.keyword + '%',
      limit: Math.min(25, input.limit),
      last_post_id: input.last_post_id,
    })
    return { posts }
  },
})

saveSDK()
