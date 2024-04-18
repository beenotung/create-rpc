// This file is generated automatically
// Don't edit this file directly

import { call, toParams } from './utils'

export let api_origin = '/api'

// POST /api/users/register
export function register(input: RegisterInput): Promise<RegisterOutput & { error?: string }> {
  return call('POST', api_origin + `/users/register`, input.body)
}
export type RegisterInput = {
  body: {
    username: string
    password: string
    tags: Array<string>
  }
}
export type RegisterOutput = {
  token: string
}

// POST /api/users/login
export function login(input: LoginInput): Promise<LoginOutput & { error?: string }> {
  return call('POST', api_origin + `/users/login`, input.body)
}
export type LoginInput = {
  body: {
    username: string
    password: string
  }
}
export type LoginOutput = {
  token: string
}

// GET /api/users/:id/profile
export function getUsersProfile(input: GetUsersProfileInput): Promise<GetUsersProfileOutput & { error?: string }> {
  let { params } = input
  return call('GET', api_origin + `/users/${params.id}/profile`)
}
export type GetUsersProfileInput = {
  params: {
    id: number
  }
}
export type GetUsersProfileOutput = {
  username: string
  tags: Array<string>
}

// PUT /api/users/:id/username
export function putUsersUsername(input: PutUsersUsernameInput): Promise<PutUsersUsernameOutput & { error?: string }> {
  let { params } = input
  return call('PUT', api_origin + `/users/${params.id}/username`, input.body)
}
export type PutUsersUsernameInput = {
  params: {
    id: number
  }
  body: {
    username: string
  }
}
export type PutUsersUsernameOutput = {
}

// POST /api/users/:id/tags
export function postUsersTags(input: PostUsersTagsInput): Promise<PostUsersTagsOutput & { error?: string }> {
  let { params } = input
  return call('POST', api_origin + `/users/${params.id}/tags`, input.body)
}
export type PostUsersTagsInput = {
  params: {
    id: number
  }
  body: {
    tag: string
  }
}
export type PostUsersTagsOutput = {
}

// DELETE /api/users/:id/tags/:tag
export function deleteUsersTags(input: DeleteUsersTagsInput): Promise<DeleteUsersTagsOutput & { error?: string }> {
  let { params } = input
  return call('DELETE', api_origin + `/users/${params.id}/tags/${params.tag}`)
}
export type DeleteUsersTagsInput = {
  params: {
    id: number
    tag: string
  }
}
export type DeleteUsersTagsOutput = {
}

// PATCH /api/users/:id/tags
export function renameUserTag(input: RenameUserTagInput): Promise<RenameUserTagOutput & { error?: string }> {
  let { params } = input
  return call('PATCH', api_origin + `/users/${params.id}/tags`, input.body)
}
export type RenameUserTagInput = {
  params: {
    id: number
  }
  body: {
    from_tag: string
    to_tag: string
  }
}
export type RenameUserTagOutput = {
}

// GET /api/users/search
export function searchUsers(input: SearchUsersInput): Promise<SearchUsersOutput & { error?: string }> {
  return call('GET', api_origin + `/users/search?` + toParams(input.query))
}
export type SearchUsersInput = {
  query: {
    username?: string
    tags?: Array<string>
    after_id?: number
    limit?: number
    order?: "new_first" | "new_last"
  }
}
export type SearchUsersOutput = {
  users: Array<{
    id: number
    username: string
    tags: Array<string>
  }>
}

// GET /api/users/:id/txn
export function getUsersTxn(input: GetUsersTxnInput): Promise<GetUsersTxnOutput & { error?: string }> {
  let { params } = input
  return call('GET', api_origin + `/users/${params.id}/txn`)
}
export type GetUsersTxnInput = {
  params: {
    id: number
  }
}
export type GetUsersTxnOutput = {
  txnList: Array<{
    id: number
    amount: number
    remark?: null | string
  }>
}
