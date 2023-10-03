// This file is generated automatically
// Don't edit this file directly

export let server_origin = 'http://localhost:8100'

export let api_origin = server_origin + '/api/core'

export function getToken() {
  return localStorage.getItem('token')
}

function call(method: string, href: string, body?: object) {
  let url = api_origin + href
  let init: RequestInit = {
    method,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + getToken(),
    }
  }
  if (body) {
    init.headers!['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  return fetch(url, init)
    .then(res => res.json())
    .catch(e => ({error: String(e)}))
    .then(json => json.error ? Promise.reject(json.error) : json)
}

function toParams(input: Record<string, any>) {
  let params = new URLSearchParams()
  for (let key in input) {
    let value = input[key]
    if (Array.isArray(value)) {
      for (let val of value) {
        params.append(key, val)
      }
    } else {
      params.set(key, value)
    }
  }
  return params
}

// POST /users/login
export function login(input: LoginInput): Promise<LoginOutput & { error?: string }> {
  return call('POST', `/users/login`, input)
}
export type LoginInput = {
  username: string
  password: string
}
export type LoginOutput = {
  user_id: number
  username: string
}

// POST /users/register
export function register(input: RegisterInput): Promise<RegisterOutput & { error?: string }> {
  return call('POST', `/users/register`, input)
}
export type RegisterInput = {
  username: string
  password: string
  tags: Array<string>
}
export type RegisterOutput = {
  user_id: number
  username: string
}

// GET /users/:id/profile
export function getUsersProfile(input: GetUsersProfileInput): Promise<GetUsersProfileOutput & { error?: string }> {
  let { id, ...rest } = input
  return call('GET', `/users/${id}/profile?` + toParams(rest))
}
export type GetUsersProfileInput = {
  id: number
}
export type GetUsersProfileOutput = {
  username: string
  tags: Array<string>
}

// PUT /users/:id/username
export function putUsersUsername(input: PutUsersUsernameInput): Promise<PutUsersUsernameOutput & { error?: string }> {
  let { id, ...rest } = input
  return call('PUT', `/users/${id}/username`, rest)
}
export type PutUsersUsernameInput = {
  id: number
  username: string
}
export type PutUsersUsernameOutput = {
}

// POST /users/:id/tags
export function postUsersTags(input: PostUsersTagsInput): Promise<PostUsersTagsOutput & { error?: string }> {
  let { id, ...rest } = input
  return call('POST', `/users/${id}/tags`, rest)
}
export type PostUsersTagsInput = {
  id: number
  tag: string
}
export type PostUsersTagsOutput = {
}

// DELETE /users/:id/tags/:tag
export function deleteUsersTags(input: DeleteUsersTagsInput): Promise<DeleteUsersTagsOutput & { error?: string }> {
  let { id, tag, ...rest } = input
  return call('DELETE', `/users/${id}/tags/${tag}?` + toParams(rest))
}
export type DeleteUsersTagsInput = {
  id: number
  tag: string
}
export type DeleteUsersTagsOutput = {
}

// PATCH /users/:id/tags
export function patchUsersTags(input: PatchUsersTagsInput): Promise<PatchUsersTagsOutput & { error?: string }> {
  let { id, ...rest } = input
  return call('PATCH', `/users/${id}/tags`, rest)
}
export type PatchUsersTagsInput = {
  id: number
  from_tag: string
  to_tag: string
}
export type PatchUsersTagsOutput = {
}

// GET /users/search
export function searchUsers(input: SearchUsersInput): Promise<SearchUsersOutput & { error?: string }> {
  return call('GET', `/users/search?` + toParams(input))
}
export type SearchUsersInput = {
  username?: string
  tags?: Array<string>
  after_id?: number
  limit?: number
  order?: "new_first" | "new_last"
}
export type SearchUsersOutput = {
}
