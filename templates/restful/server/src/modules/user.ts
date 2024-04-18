import { array, id, int, object, optional, string, values } from 'cast.ts'
import httpStatus from 'http-status'
import { defModule } from '../api'
import { filter, find, seedRow } from 'better-sqlite3-proxy'
import { proxy } from '../proxy'
import { HttpError } from '../http.error'
import { comparePassword, hashPassword } from '../hash'
import { encodeJWT } from '../jwt'

export let userModule = defModule({ name: 'user' })
let { defAPI } = userModule

defAPI('POST', '/users/register', {
  name: 'register',
  inputParser: object({
    body: object({
      username: string({ trim: true, nonEmpty: true }),
      password: string({ trim: true, nonEmpty: true }),
      tags: array(string({ trim: true, nonEmpty: true })),
    }),
  }),
  sampleOutput: {
    token: 'sample-jwt-token',
  },
  jwt: false,
  async fn(input) {
    let user = find(proxy.user, { username: input.body.username })
    if (user)
      throw new HttpError(
        httpStatus.CONFLICT,
        'this username is already in use',
      )
    let user_id = proxy.user.push({
      username: input.body.username,
      password_hash: await hashPassword(input.body.password),
      is_admin: false,
    })
    for (let name of input.body.tags) {
      let tag_id = seedRow(proxy.tag, { name })
      proxy.user_tag.push({ user_id, tag_id })
    }
    let token = encodeJWT({ id: user_id, is_admin: false })
    return { token }
  },
})

defAPI('POST', '/users/login', {
  name: 'login',
  inputParser: object({
    body: object({
      username: string({ trim: true, nonEmpty: true }),
      password: string({ trim: true, nonEmpty: true }),
    }),
  }),
  sampleOutput: {
    token: 'sample-jwt-token',
  },
  jwt: false,
  async fn(input) {
    let user = find(proxy.user, { username: input.body.username })
    if (!user) throw new HttpError(404, 'this username is not used')
    let matched = await comparePassword({
      password: input.body.password,
      password_hash: user.password_hash,
    })
    if (!matched)
      throw new HttpError(httpStatus.UNAUTHORIZED, 'wrong username or password')
    let token = encodeJWT({ id: user.id!, is_admin: user.is_admin })
    return { token }
  },
})

defAPI('GET', '/users/:id/profile', {
  inputParser: object({
    params: object({
      id: id(),
    }),
  }),
  outputParser: object({
    username: string(),
    tags: array(string()),
  }),
  jwt: false,
  fn(input) {
    let user = proxy.user[input.params.id]
    if (!user) throw new HttpError(404, 'user not found')
    return {
      username: user.username,
      tags: filter(proxy.user_tag, { user_id: input.params.id }).map(
        row => row.tag?.name,
      ),
    }
  },
})

defAPI('PUT', '/users/:id/username', {
  inputParser: object({
    params: object({
      id: id(),
    }),
    body: object({
      username: string(),
    }),
  }),
  jwt: true,
  fn(input, jwt) {
    if (jwt.id != input.params.id)
      throw new HttpError(
        httpStatus.FORBIDDEN,
        "you cannot change other user's username",
      )
    throw new HttpError(httpStatus.NOT_IMPLEMENTED, 'TODO')
  },
})

defAPI('POST', '/users/:id/tags', {
  inputParser: object({
    params: object({
      id: id(),
    }),
    body: object({
      tag: string(),
    }),
  }),
  jwt: true,
  fn(input, jwt) {
    if (!jwt.is_admin && jwt.id != input.params.id)
      throw new HttpError(
        httpStatus.FORBIDDEN,
        "only admin can add other user's tag",
      )
    throw new HttpError(httpStatus.NOT_IMPLEMENTED, 'TODO')
  },
})

defAPI('DELETE', '/users/:id/tags/:tag', {
  inputParser: object({
    params: object({
      id: id(),
      tag: string(),
    }),
  }),
  jwt: true,
  fn(input, jwt) {
    if (!jwt.is_admin && jwt.id != input.params.id)
      throw new HttpError(
        httpStatus.FORBIDDEN,
        "only admin can remove other user's tag",
      )
    throw new HttpError(httpStatus.NOT_IMPLEMENTED, 'TODO')
  },
})

defAPI('PATCH', '/users/:id/tags', {
  name: 'renameUserTag',
  inputParser: object({
    params: object({
      id: id(),
    }),
    body: object({
      from_tag: string(),
      to_tag: string(),
    }),
  }),
  jwt: true,
  fn(input, jwt) {
    if (!jwt.is_admin && jwt.id != input.params.id)
      throw new HttpError(
        httpStatus.FORBIDDEN,
        "only admin can edit other user's tag",
      )
    throw new HttpError(httpStatus.NOT_IMPLEMENTED, 'TODO')
  },
})

defAPI('GET', '/users/search', {
  name: 'searchUsers',
  inputParser: object({
    query: object({
      username: optional(string()),
      tags: optional(array(string(), { maxLength: 7 })),
      after_id: optional(id()),
      limit: optional(int({ min: 1, max: 25 })),
      order: optional(values(['new_first' as const, 'new_last' as const])),
    }),
  }),
  sampleOutput: {
    users: [
      {
        id: 1,
        username: 'alice',
        tags: ['marketing'],
      },
    ],
  },
})

defAPI('GET', '/users/:id/txn', {
  sampleInput: { params: { id: 1 } },
  sampleOutput: {
    txnList: [
      {
        id: 1,
        amount: 12.3,
        remark$nullable$optional: 'demo txn',
      },
    ],
  },
  jwt: true,
  fn(input, jwt) {
    return {
      txnList: [
        {
          id: 1,
          amount: 12.3,
          remark: null,
        },
        {
          id: 2,
          amount: 3.14,
          remark: 'pi',
        },
        {
          id: 3,
          amount: 42,
        },
      ],
    }
  },
})

userModule.saveSDK()
