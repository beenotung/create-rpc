import { print } from 'listening-on'
import { env } from './env'
import { app } from './app'
import { attachErrorHandling } from './error'
import './ws/parsers'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { listenWSSConnection } from './ws/server'

attachErrorHandling(app)

let server = createServer(app)
let wss = new WebSocketServer({ server })

listenWSSConnection(wss)

server.listen(env.PORT, () => {
  print(env.PORT)
})
