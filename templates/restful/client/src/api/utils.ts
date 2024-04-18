import jwtDecode from 'jwt-decode'

export let server_origin = 'http://localhost:3000'

export type JWTPayload = {
  id: number
  is_admin: boolean
}

let store = typeof window == 'undefined' ? null : localStorage

let token = store?.getItem('token')

export function getToken() {
  return token
}

export function getJWTPayload() {
  if (!token) return null
  return jwtDecode(token) as JWTPayload
}

export function clearToken() {
  token = null
  store?.removeItem('token')
}

export function call(method: string, href: string, body?: object) {
  let url = server_origin + href
  let init: RequestInit = {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + getToken(),
    },
  }
  if (body) {
    Object.assign(init.headers!, {
      'Content-Type': 'application/json',
    })
    init.body = JSON.stringify(body)
  }
  return fetch(url, init)
    .then(res => res.json())
    .catch(err => ({ error: String(err) }))
    .then(json => {
      if (json.error) {
        return Promise.reject(json.error)
      }
      if (json.token) {
        token = json.token as string
        store?.setItem('token', token)
      }
      return json
    })
}

export function toParams(input: Record<string, any>) {
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
