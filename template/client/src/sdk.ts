let api_origin = 'http://localhost:3000/api'

function post(url: string, body: object) {
  return fetch(api_origin + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .catch(err => ({ error: String(err) }))
}

export type CreateUserInput = {
  username: string;
  password: string;
}
export type CreateUserOutput = {
  id: number;
}
export function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
	return post('/createUser', input)
}
