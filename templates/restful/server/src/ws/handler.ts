import { WSClientMessage } from './types'
import { ManagedWebsocket } from './server'
import { Server } from 'ws'
import debug from 'debug'
import { getWsSession, WsSession } from './session'

let log = debug('ws:handler')
log.enabled = true

type ClientMessageHandler<T extends WSClientMessage> = {
  (event: T, session: WsSession, wss: Server): void | Promise<void>
}

let handlers = new Map<
  WSClientMessage['type'],
  ClientMessageHandler<WSClientMessage>[]
>()

export function defWSHandler<T extends WSClientMessage>(
  type: T['type'],
  handler: ClientMessageHandler<T>,
) {
  let list = handlers.get(type)
  if (!list) {
    list = []
    handlers.set(type, list)
  }
  list.push(handler as ClientMessageHandler<WSClientMessage>)
}

export async function onMessage(
  event: WSClientMessage,
  ws: ManagedWebsocket,
  wss: Server,
): Promise<void> {
  let session = getWsSession(ws)
  let list = handlers.get(event.type)
  if (!list || list.length === 0) {
    log('unknown ws client message type:', event.type)
    return
  }
  for (let handler of list) {
    await handler(event, session, wss)
  }
}
