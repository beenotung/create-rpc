// This file is generated automatically
// Don't edit this file directly

import { call, toParams } from './utils'

export let api_origin = '/api'

// GET /api/demo/greet
export function greet(input: GreetInput): Promise<GreetOutput & { error?: string }> {
  return call('GET', api_origin + `/demo/greet?` + toParams(input.query))
}
export type GreetInput = {
  query: {
    name: string
  }
}
export type GreetOutput = {
  message: string
}

// POST /api/demo/add
export function add(input: AddInput): Promise<AddOutput & { error?: string }> {
  return call('POST', api_origin + `/demo/add`, input.body)
}
export type AddInput = {
  body: {
    a: number
    b: number
  }
}
export type AddOutput = {
  c: number
}
