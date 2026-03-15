import { server_origin } from './config'
import { connectWS, ManagedWebsocket } from './ws'
import { WSClientMessage, WSServerMessage } from './ws-types'

let store = typeof window == 'undefined' ? null : localStorage

let token = store?.getItem('token')

export function getToken() {
  return token
}

export function clearToken() {
  token = null
  store?.removeItem('token')
}

export function post(url: string, body: object, token_?: string) {
  return fetch(server_origin + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token_,
    },
    body: JSON.stringify(body),
  })
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
