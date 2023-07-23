// This file is generated automatically
// Don't edit this file directly

import { post } from './utils'

let api_origin = '/api/user'

export type RegisterInput = {
  username: string
  password: string
}
export type RegisterOutput = {
  token: string
}
export function register(input: RegisterInput): Promise<RegisterOutput & { error?: string }> {
	return post(api_origin + '/register', input)
}

export type LoginInput = {
  username: string
  password: string
}
export type LoginOutput = {
  token: string
}
export function login(input: LoginInput): Promise<LoginOutput & { error?: string }> {
	return post(api_origin + '/login', input)
}

export type GetUserListInput = {
}
export type GetUserListOutput = {
  users: Array<{
    id: number
    username: string
    is_admin: boolean
  }>
}
export function getUserList(input: GetUserListInput): Promise<GetUserListOutput & { error?: string }> {
	return post(api_origin + '/getUserList', input)
}
