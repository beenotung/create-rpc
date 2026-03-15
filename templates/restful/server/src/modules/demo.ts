/**
 * Demo input output of API
 */
import { int, object, string } from 'cast.ts'
import { defModule } from '../api'

export let demoModule = defModule({ name: 'demo' })
let { defAPI } = demoModule

defAPI('GET', '/demo/greet', {
  name: 'greet',
  inputParser: object({
    query: object({
      name: string({ trim: true, nonEmpty: true }),
    }),
  }),
  sampleOutput: {
    message: 'hello world',
  },
  jwt: false,
  fn(input) {
    return {
      message: 'hello ' + input.query.name,
    }
  },
})

defAPI('POST', '/demo/add', {
  name: 'add',
  inputParser: object({
    body: object({
      a: int(),
      b: int(),
    }),
  }),
  outputParser: object({
    c: int(),
  }),
  jwt: false,
  fn(input) {
    return {
      c: input.body.a + input.body.b,
    }
  },
})

demoModule.saveClient()
