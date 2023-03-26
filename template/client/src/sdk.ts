let api_origin = 'http://localhost:3000/api'

let token = localStorage.getItem('token')

export function clearToken() {
  token = null
  localStorage.removeItem('token')
}

function post(url: string, body: object) {
  return fetch(api_origin + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
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
        localStorage.setItem('token', token)
      }
      return json
    })
}

export type SignupInput = {
  username: string;
  password: string;
}
export type SignupOutput = {
  token: string;
}
export function signup(input: SignupInput): Promise<SignupOutput & { error?: string }> {
	return post('/signup', input)
}

export type SigninInput = {
  username: string;
  password: string;
}
export type SigninOutput = {
  token: string;
}
export function signin(input: SigninInput): Promise<SigninOutput & { error?: string }> {
	return post('/signin', input)
}

export type CreatePostInput = {
  content: string;
}
export type CreatePostOutput = {
  id: number;
}
export function createPost(input: CreatePostInput): Promise<CreatePostOutput & { error?: string }> {
	return post('/createPost', input)
}

export type GetPostListInput = {
  limit: number;
  last_post_id: number;
  keyword: string;
}
export type GetPostListOutput = {
  posts: Array<{
    id: number;
    user_id: number;
    username: string;
    content: string;
  }>;
}
export function getPostList(input: GetPostListInput): Promise<GetPostListOutput & { error?: string }> {
	return post('/getPostList', input)
}
