import { find } from 'better-sqlite3-proxy'
import { defModule } from './api'
import { db } from './db'
import { HttpError } from './error'
import { hashPassword, comparePassword } from './hash'
import { encodeJWT, JWTPayload } from './jwt'
import { proxy } from './proxy'

export let core = defModule()

let { defAPI } = core

function checkUserId(input: { username: string; password: string }) {
  if (input.username.length < 1)
    throw new HttpError(400, 'username must be at least one character')
  if (input.username.length > 32)
    throw new HttpError(400, 'username must not exceed 32 characters')
  if (input.password.length < 6)
    throw new HttpError(400, 'password must be at least 6 characters')
  if (input.password.length > 256)
    throw new HttpError(400, 'password must not exceed 256 characters')
}

function checkAdmin(jwt: JWTPayload) {
  if (!jwt.is_admin)
    throw new HttpError(403, 'This API is only accessible by admin')
}

defAPI({
  name: 'register',
  sampleInput: {
    username: 'alice',
    password: 'secret',
  },
  sampleOutput: { token: 'a-jwt-string' },
  fn: async input => {
    checkUserId(input)
    let user = find(proxy.user, { username: input.username })
    if (user) throw new HttpError(409, 'this username is already in use')
    let id = proxy.user.push({
      username: input.username,
      password_hash: await hashPassword(input.password),
      is_admin: false,
    })
    let token = encodeJWT({ id, is_admin: false })
    return { token }
  },
})

defAPI({
  name: 'login',
  sampleInput: {
    username: 'alice',
    password: 'secret',
  },
  sampleOutput: { token: 'a-jwt-string' },
  async fn(input) {
    checkUserId(input)
    let user = find(proxy.user, { username: input.username })
    if (!user) throw new HttpError(404, 'this username is not used')
    let matched = await comparePassword({
      password: input.password,
      password_hash: user.password_hash,
    })
    if (!matched) throw new HttpError(401, 'wrong username or password')
    let token = encodeJWT({ id: user.id!, is_admin: user.is_admin })
    return { token }
  },
})

let select_recent_log = db.prepare(/* sql */ `
select
  log.id
, log.user_id
, user.username
, log.created_at as timestamp
, log.rpc
, log.input
from user
inner join log on log.user_id = user.id
where user.username like :keyword
  and log.id < :last_log_id
order by log.id desc
limit :limit
`)
let count_recent_log = db
  .prepare(
    /* sql */ `
select
  count(*) as count
from user
inner join log on log.user_id = user.id
where user.username like :keyword
  and log.id < :last_log_id
`,
  )
  .pluck()
defAPI({
  name: 'getRecentUserList',
  jwt: true,
  sampleInput: { limit: 5, last_log_id: 0, keyword: 'alice' },
  sampleOutput: {
    users: [
      {
        id: 1,
        user_id: 1,
        username: 'alice',
        created_at: '2023-03-29 08:00:00',
      },
    ],
    remains: 3,
  },
  fn(input, jwt) {
    checkAdmin(jwt)
    let users = select_recent_log.all({
      keyword: '%' + input.keyword + '%',
      last_log_id: input.last_log_id,
      limit: Math.min(25, input.limit),
    })
    let remains = count_recent_log.get({
      keyword: '%' + input.keyword + '%',
      last_log_id: input.last_log_id,
    })
    remains -= users.length
    return { users, remains }
  },
})

// a shorter api for easy copy-paste into new APIs
defAPI({
  name: 'greet',
  sampleInput: { name: 'world' },
  sampleOutput: { message: 'hello world' },
  fn(input) {
    return { message: 'hello ' + input.name }
  },
})

core.saveSDK()
