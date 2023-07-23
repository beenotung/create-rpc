import { find, Table } from 'better-sqlite3-proxy'
import {
  array,
  boolean,
  id,
  int,
  nullable,
  object,
  optional,
  string,
} from 'cast.ts'
import { defModule } from '../api'
import { db } from '../db'
import { HttpError } from '../error'
import { encodeJWT, JWTPayload } from '../jwt'
import { proxy, User } from '../proxy'

let apis = defModule({ name: 'demo' })
let { defAPI } = apis

defAPI({
  name: 'greet',
  sampleInput: {
    name: 'world',
  },
  sampleOutput: {
    message: 'hello world',
  },
  fn(input) {
    return {
      message: 'hello ' + input.name,
    }
  },
})

defAPI({
  name: 'add',
  inputParser: object({
    a: int(),
    b: int(),
  }),
  outputParser: object({
    c: int(),
  }),
  fn(input) {
    return {
      c: input.a + input.b,
    }
  },
})

apis.saveClient()

export default apis
