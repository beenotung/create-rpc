import { ManagedWebsocket } from './server'

export type WsSession = {
  ws: ManagedWebsocket
  onCloseListeners: Array<(session: WsSession) => void>
  // add custom fields here
  start_time: number
}

export let sessions = new Map<ManagedWebsocket, WsSession>()

export function startWsSession(ws: ManagedWebsocket): void {
  sessions.set(ws, {
    ws,
    onCloseListeners: [],
    start_time: Date.now(),
  })
}

export function getWsSession(ws: ManagedWebsocket): WsSession {
  let session = sessions.get(ws)
  if (!session) {
    throw new Error('ws session not registered')
  }
  return session
}

export function closeWsSession(
  ws: ManagedWebsocket,
  code?: number,
  reason?: Buffer,
): void {
  let session = sessions.get(ws)
  if (!session) return
  sessions.delete(ws)
  session.onCloseListeners.forEach(fn => fn(session))
}
