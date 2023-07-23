// This file is generated automatically
// Don't edit this file directly

import { post } from './utils'

let api_origin = '/api/demo'

export type GreetInput = {
  name: string
}
export type GreetOutput = {
  message: string
}
export function greet(input: GreetInput): Promise<GreetOutput & { error?: string }> {
	return post(api_origin + '/greet', input)
}

export type AddInput = {
  a: number
  b: number
}
export type AddOutput = {
  c: number
}
export function add(input: AddInput): Promise<AddOutput & { error?: string }> {
	return post(api_origin + '/add', input)
}
