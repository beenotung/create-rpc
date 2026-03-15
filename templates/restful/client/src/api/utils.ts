import { jwtDecode } from 'jwt-decode'
import { server_origin } from './config'
import { connectWS, ManagedWebsocket } from './ws'
import { WSClientMessage, WSServerMessage } from './ws-types'

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
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + getToken(),
      'Cache-Control': 'no-cache',
    },
  }
  if (body) {
    Object.assign(init.headers!, {
      'Content-Type': 'application/json',
    })
    init.body = JSON.stringify(body)
  }
  return fetch(url, init)
    .then(res =>
      res.text().then(text => {
        try {
          return JSON.parse(text)
        } catch {
          let error = res.status.toString()
          if (res.statusText) error += ' ' + res.statusText
          if (text) error += ': ' + text
          return { error }
        }
      }),
    )
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

let wsUrl = server_origin.replace('http', 'ws')
let ws: ManagedWebsocket | null = null
connectWS({
  createWS: protocol => {
    console.log('connecting ws...')
    return new WebSocket(wsUrl, [protocol])
  },
  attachWS: _ws => {
    ws = _ws
    console.log('attach ws')
  },
  onMessage: async data => {
    console.log('onMessage', data)
    let listeners = wsMessageListeners.get(data.type)
    if (!listeners) return
    for (let listener of listeners) {
      await listener(data)
    }
  },
})

export type WSMessageListener<T extends WSServerMessage> = {
  (event: T & { type: T['type'] }): void | Promise<void>
}

let wsMessageListeners = new Map<string, Set<WSMessageListener<any>>>()

export function onWSMessage<T extends WSServerMessage>(
  type: T['type'],
  listener: NoInfer<WSMessageListener<T>>,
) {
  let listeners = wsMessageListeners.get(type)
  if (!listeners) {
    listeners = new Set()
    wsMessageListeners.set(type, listeners)
  }
  listeners.add(listener)
  function unsubscribe() {
    listeners!.delete(listener)
  }
  return { unsubscribe }
}

export function sendWsMessage(message: WSClientMessage) {
  function check() {
    if (!ws || ws.ws.readyState !== WebSocket.OPEN) {
      console.log('ws not connected, waiting for connection...')
      setTimeout(check, 200)
      return
    }
    console.log('send ws message:', message)
    ws.send(message)
  }
  check()
}
