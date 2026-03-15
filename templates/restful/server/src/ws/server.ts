/**
 * Modified from wss-lite in ts-liveview
 */

import type { Server } from 'ws'
import { Request } from 'express'
import debug from 'debug'
import type WebSocket from 'ws'
import { WSServerMessage, Ping, Pong, Send } from './types'
import { onMessage } from './handler'
import { startWsSession, closeWsSession } from './session'
import { randomUUID } from 'crypto'
import { wsClientMessageParser, wsServerMessageParser } from './parsers'
import { HttpError } from '../error'

let log = debug('ws:server')
log.enabled = true

export type ManagedWebsocket = {
  ws: WebSocket
  wss: Server
  request: Request
  session_id: string
  send(message: WSServerMessage): void
  close(code?: number, reason?: Buffer): void
}

export function listenWSSConnection(wss: Server) {
  wss.on('connection', (ws, request) => {
    if (ws.protocol !== 'ws-lite') {
      log('unknown ws protocol:', ws.protocol)
      return
    }
    ws.on('close', (code, reason) => {
      closeWsSession(managedWS, code, reason)
    })

    function close(code?: number, reason?: Buffer) {
      ws.close(code, reason)
    }

    function send(message: WSServerMessage) {
      message = wsServerMessageParser.parse(message)
      let data = Send + JSON.stringify(message)
      ws.send(data)
    }

    ws.on('message', async data => {
      let message = String(data)
      if (message === Ping) {
        if (ws.bufferedAmount === 0) {
          ws.send(Pong)
        }
        return
      }
      if (message === Pong) {
        return
      }
      if (message[0] === Send) {
        try {
          let json = JSON.parse(message.slice(1))
          let input = wsClientMessageParser.parse(json)
          await onMessage(input, managedWS, wss)
        } catch (error) {
          send({ type: 'error', message: HttpError.toString(error) })
        }
        return
      }
      log('received unknown ws message:', data)
    })

    const managedWS: ManagedWebsocket = {
      ws,
      wss,
      request: request as Request,
      session_id: randomUUID(),
      send,
      close,
    }
    startWsSession(managedWS)
  })
}
