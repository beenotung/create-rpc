export let server_origin = 'http://localhost:3000'

let api_origin = 'http://localhost:3000/api'

let store = typeof window == 'undefined' ? null : localStorage

let token = store?.getItem('token')

export function getToken() {
  return token
}

export function clearToken() {
  token = null
  store?.removeItem('token')
}

function post(url: string, body: object, token_?: string) {
  return fetch(api_origin + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token_
    },
    body: JSON.stringify(body)
  })
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

export type GreetInput = {
  name: string;
}
export type GreetOutput = {
  message: string;
}
export function greet(input: GreetInput): Promise<GreetOutput & { error?: string }> {
	return post('/greet', input)
}

export type RegisterInput = {
  username: string;
  password: string;
}
export type RegisterOutput = {
  token: string;
}
export function register(input: RegisterInput): Promise<RegisterOutput & { error?: string }> {
	return post('/register', input)
}

export type LoginInput = {
  username: string;
  password: string;
}
export type LoginOutput = {
  token: string;
}
export function login(input: LoginInput): Promise<LoginOutput & { error?: string }> {
	return post('/login', input)
}

export type GetRecentUserListInput = {
  limit: number;
  last_log_id: number;
  keyword: string;
}
export type GetRecentUserListOutput = {
  users: Array<{
    id: number;
    user_id: number;
    username: string;
    created_at: string;
  }>;
  remains: number;
}
export function getRecentUserList(input: GetRecentUserListInput & { token: string }): Promise<GetRecentUserListOutput & { error?: string }> {
  let { token, ...body } = input
	return post('/getRecentUserList', body, token)
}

export type DemoInput = {
}
export type DemoOutput = {
}
export function demo(input: DemoInput): Promise<DemoOutput & { error?: string }> {
	return post('/demo', input)
}
