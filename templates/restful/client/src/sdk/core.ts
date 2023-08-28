
let api_origin = "http://localhost:8100/core"

export function getToken() {
  return localStorage.getItem('token')
}

function call(method: string, href: string, body?: object) {
  let url = api_origin + href
  let p = method == 'GET'
    ? fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + getToken(),
        'Accept': 'application/json',
      }
    })
    : fetch(url, {
      method,
      headers: {
        'Authorization': 'Bearer ' + getToken(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
  return p
    .then(res => res.json())
    .catch(e => ({error: String(e)}))
    .then(json => json.error ? Promise.reject(json.error) : json)
}

export type LoginInput = {
  username: string
  password: string
}
export type LoginOutput = {
  user_id: number
  username: string
}
export function login(input: LoginInput): Promise<LoginOutput> {
  return call('POST', `/users/login`, input)
}

export type RegisterInput = {
  username: string
  password: string
}
export type RegisterOutput = {
  user_id: number
  username: string
}
export function register(input: RegisterInput): Promise<RegisterOutput> {
  return call('POST', `/users/register`, input)
}

export type GetUsersProfileOutput = {
  username: string
}
export function getUsersProfile(id: number | string): Promise<GetUsersProfileOutput> {
  return call('GET', `/users/${id}/profile`)
}

export type GetBookingServicesOutput = {
  services: Array<{
    id: number
    title: string
    desc: string
    image: string
  }>
}
export function getBookingServices(): Promise<GetBookingServicesOutput> {
  return call('GET', `/booking/services`)
}

export type CreateServiceAppointmentInput = {
  date: string
  time: string
  provider_id?: number
  remark?: string
}
export function createServiceAppointment(id: number | string, input: CreateServiceAppointmentInput): Promise<{}> {
  return call('POST', `/booking/services/${id}/appointment`, input)
}

export type SearchUsersInput = {
  username?: string
  district?: string
}
export function searchUsers(input: SearchUsersInput): Promise<{}> {
  return call('GET', `/users/search?` + new URLSearchParams(input))
}
