import { find, Table } from 'better-sqlite3-proxy'
import { array, boolean, id, nullable, object, optional, string } from 'cast.ts'
import httpStatus from 'http-status'
import { defModule } from './api'
import { db } from './db'
import { HttpError } from './error'
import { comparePassword, hashPassword } from './hash'
import { encodeJWT, JWTPayload } from './jwt'
import { proxy, User } from './proxy'

let core = defModule()
let { defAPI } = core

defAPI({
  name: 'greet',
  sampleInput: { name: 'world' },
  sampleOutput: { message: 'hello world' },
  fn(input) {
    return { message: 'hello ' + input.name }
  },
})

let authParser = object({
  username: string({ minLength: 1, maxLength: 32, sampleValue: 'alice' }),
  password: string({ minLength: 6, maxLength: 256, sampleValue: 'secret' }),
})

defAPI({
  name: 'register',
  inputParser: authParser,
  sampleOutput: { token: 'a-jwt-string' },
  fn: async input => {
    let user = find(proxy.user, { username: input.username })
    if (user)
      throw new HttpError(
        httpStatus.CONFLICT,
        'this username is already in use',
      )
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
  inputParser: authParser,
  sampleOutput: { token: 'a-jwt-string' },
  async fn(input) {
    let user = find(proxy.user, { username: input.username })
    if (!user) throw new HttpError(404, 'this username is not used')
    let matched = await comparePassword({
      password: input.password,
      password_hash: user.password_hash,
    })
    if (!matched)
      throw new HttpError(httpStatus.UNAUTHORIZED, 'wrong username or password')
    let token = encodeJWT({ id: user.id!, is_admin: user.is_admin })
    return { token }
  },
})

defAPI({
  name: 'getUserList',
  outputParser: object({
    users: array(
      object({
        id: id(),
        username: string(),
        is_admin: boolean(),
      }),
    ),
  }),
  fn() {
    return { users: proxy.user as Table<User> }
  },
})

let select_recent_log = db.prepare<
  {
    username: string
    last_log_id: number
    limit: number
  },
  {
    id: number
    user_id: number
    username: string
    timestamp: string
    rpc: string
    input: string
  }
>(/* sql */ `
select
  log.id
, log.user_id
, user.username
, log.created_at as timestamp
, log.rpc
, log.input
from user
inner join log on log.user_id = user.id
where user.username like :username
  and log.id < :last_log_id
order by log.id desc
limit :limit
`)
let count_recent_log = db
  .prepare<
    {
      username: string
      last_log_id: number
    },
    number
  >(
    /* sql */ `
select
  count(*) as count
from user
inner join log on log.user_id = user.id
where user.username like :username
  and log.id < :last_log_id
`,
  )
  .pluck()
defAPI({
  name: 'getRecentLogs',
  jwt: true,
  role: 'admin',
  sampleInput: { limit: 5, last_log_id: 0, username: 'alice' },
  sampleOutput: {
    users: [
      {
        id: 1,
        user_id: 1,
        username: 'alice',
        timestamp: '2023-03-29 08:00:00',
        rpc: 'getRecentUserList',
        input: '{"keyword":"alice"}',
      },
    ],
    remains: 3,
  },
  fn(input, jwt) {
    let users = select_recent_log.all({
      username: '%' + input.username + '%',
      last_log_id: input.last_log_id,
      limit: Math.min(25, input.limit),
    })
    let remains = count_recent_log.get({
      username: '%' + input.username + '%',
      last_log_id: input.last_log_id,
    }) as number
    remains -= users.length
    return { users, remains }
  },
})

// a shorter api for easy copy-paste into new APIs
defAPI({
  name: 'demo',
  // sampleInput: {},
  // sampleOutput: {},
  // inputParser: object({}),
  // outputParser: object({}),
  // fn(input) {
  //   return {  }
  // },
})

core.saveSDK()

export default core
