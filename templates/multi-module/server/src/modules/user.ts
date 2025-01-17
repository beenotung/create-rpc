import { find, Table } from 'better-sqlite3-proxy'
import { array, boolean, id, object, ParseResult, string } from 'cast.ts'
import httpStatus from 'http-status'
import { defModule } from '../api'
import { db } from '../db'
import { HttpError } from '../error'
import { hashPassword, comparePassword } from '../hash'
import { JWTPayload, encodeJWT } from '../jwt'
import { proxy, User } from '../proxy'

let apis = defModule({ name: 'user' })

let { defAPI } = apis

let authParser = object({
  username: string({ minLength: 1, maxLength: 32, sampleValue: 'alice' }),
  password: string({ minLength: 6, maxLength: 256, sampleValue: 'secret' }),
})

let maskPassword = (input: Partial<ParseResult<typeof authParser>>) => {
  let { password, ...rest } = input
  if (password) {
    password = '*'.repeat(password.length)
  }
  return { ...rest, password }
}

defAPI({
  name: 'register',
  inputParser: authParser,
  sampleOutput: { token: 'a-jwt-string' },
  transformInputForLog: maskPassword,
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
  transformInputForLog: maskPassword,
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

let select_user_list = db.prepare<
  void[],
  {
    id: number
    username: string
    is_admin: boolean
  }
>(/* sql */ `
select
  id
, username
, is_admin
from user
`)

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
    return { users: select_user_list.all() }
  },
})

apis.saveClient()

export default apis
