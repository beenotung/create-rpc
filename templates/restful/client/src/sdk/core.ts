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
  return call('POST', `/users/login`, input.body)
}
export type LoginInput = {
  body: {
    username: string
    password: string
  }
}
export type LoginOutput = {
  user_id: number
  username: string
}

// POST /users/register
export function register(input: RegisterInput): Promise<RegisterOutput & { error?: string }> {
  return call('POST', `/users/register`, input.body)
}
export type RegisterInput = {
  body: {
    username: string
    password: string
    tags: Array<string>
  }
}
export type RegisterOutput = {
  user_id: number
  username: string
}

// GET /users/:id/profile
export function getUsersProfile(input: GetUsersProfileInput): Promise<GetUsersProfileOutput & { error?: string }> {
  let { params } = input
  return call('GET', `/users/${params.id}/profile`)
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

// PUT /users/:id/username
export function putUsersUsername(input: PutUsersUsernameInput): Promise<PutUsersUsernameOutput & { error?: string }> {
  let { params } = input
  return call('PUT', `/users/${params.id}/username`, input.body)
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

// POST /users/:id/tags
export function postUsersTags(input: PostUsersTagsInput): Promise<PostUsersTagsOutput & { error?: string }> {
  let { params } = input
  return call('POST', `/users/${params.id}/tags`, input.body)
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

// DELETE /users/:id/tags/:tag
export function deleteUsersTags(input: DeleteUsersTagsInput): Promise<DeleteUsersTagsOutput & { error?: string }> {
  let { params } = input
  return call('DELETE', `/users/${params.id}/tags/${params.tag}`)
}
export type DeleteUsersTagsInput = {
  params: {
    id: number
    tag: string
  }
}
export type DeleteUsersTagsOutput = {
}

// PATCH /users/:id/tags
export function patchUsersTags(input: PatchUsersTagsInput): Promise<PatchUsersTagsOutput & { error?: string }> {
  let { params } = input
  return call('PATCH', `/users/${params.id}/tags`, input.body)
}
export type PatchUsersTagsInput = {
  params: {
    id: number
  }
  body: {
    from_tag: string
    to_tag: string
  }
}
export type PatchUsersTagsOutput = {
}

// GET /users/search
export function searchUsers(input: SearchUsersInput): Promise<SearchUsersOutput & { error?: string }> {
  return call('GET', `/users/search?` + toParams(input.query))
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
}
