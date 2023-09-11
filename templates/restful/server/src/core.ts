import { array, id, object, optional, string } from 'cast.ts'
import httpStatus from 'http-status'
import { defModule } from './api'

export let core = defModule({ name: 'core' })
let { defAPI } = core

defAPI('POST', '/users/login', {
  name: 'login',
  input: object({
    username: string({ trim: true, nonEmpty: true }),
    password: string({ trim: true, nonEmpty: true }),
  }),
  output: object({
    user_id: id(),
    username: string(),
  }),
  fn(input) {
    return { user_id: 1 }
  },
})

defAPI('POST', '/users/register', {
  name: 'register',
  input: object({
    username: string({ trim: true, nonEmpty: true }),
    password: string({ trim: true, nonEmpty: true }),
  }),
  output: object({
    user_id: id(),
    username: string(),
  }),
  fn(input) {
    return { user_id: 1 }
  },
})

defAPI('GET', '/users/:id/profile', {
  output: object({
    username: string(),
  }),
})

defAPI('GET', '/booking/services', {
  output: object({
    services: array(
      object({
        id: id(),
        title: string(),
        desc: string(),
        image: string(),
      }),
    ),
  }),
})

defAPI('POST', '/booking/services/:id/appointment', {
  name: 'createServiceAppointment',
  input: object({
    date: string(),
    time: string(),
    provider_id: optional(id()),
    remark: optional(string({ trim: true })),
  }),
  fn(input, { id }) {},
})

defAPI('GET', '/users/search', {
  name: 'searchUsers',
  input: object({
    username: optional(string()),
    district: optional(string()),
  }),
})
