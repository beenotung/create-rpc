import { array, id, int, object, optional, string, values } from 'cast.ts'
import httpStatus from 'http-status'
import { defModule } from '../api'

export let userModule = defModule({ name: 'user' })
let { defAPI } = userModule

defAPI('POST', '/users/login', {
  name: 'login',
  inputParser: object({
    body: object({
      username: string({ trim: true, nonEmpty: true }),
      password: string({ trim: true, nonEmpty: true }),
    }),
  }),
  outputParser: object({
    user_id: id(),
  }),
  fn(input) {
    return { user_id: 1 }
  },
})

defAPI('POST', '/users/register', {
  name: 'register',
  inputParser: object({
    body: object({
      username: string({ trim: true, nonEmpty: true }),
      password: string({ trim: true, nonEmpty: true }),
      tags: array(string({ trim: true, nonEmpty: true })),
    }),
  }),
  outputParser: object({
    user_id: id(),
  }),
  fn(input) {
    return { user_id: 1 }
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
})

defAPI('DELETE', '/users/:id/tags/:tag', {
  inputParser: object({
    params: object({
      id: id(),
      tag: string(),
    }),
  }),
})

defAPI('PATCH', '/users/:id/tags', {
  inputParser: object({
    params: object({
      id: id(),
    }),
    body: object({
      from_tag: string(),
      to_tag: string(),
    }),
  }),
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
})

userModule.saveSDK()
