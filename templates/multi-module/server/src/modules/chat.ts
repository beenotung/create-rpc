/**
 * Demo using WebSocket and REST for real-time chat
 */
import { array, id, int, object, string } from 'cast.ts'
import { defModule } from '../api'
import { defWSHandler } from '../ws/handler'
import { WsSession } from '../ws/session'
import { WSServerMessage } from '../ws/types'

export let chatModule = defModule({ name: 'chat' })
let { defAPI } = chatModule

type RoomMessage = {
  sender_id: number
  content: string
  timestamp: number
}
let roomMessages = new Map<number, RoomMessage[]>()
let roomMembers = new Map<number, Set<WsSession>>()

defAPI({
  name: 'sendChatMessage',
  inputParser: object({
    room_id: id(),
    message: string(),
  }),
  outputParser: object({ notify_count: int() }),
  jwt: true,
  fn(input, jwt) {
    let room_id = input.room_id

    let messages = roomMessages.get(room_id)
    if (!messages) {
      messages = []
      roomMessages.set(room_id, messages)
    }

    let message: RoomMessage = {
      sender_id: jwt.id,
      content: input.message,
      timestamp: Date.now(),
    }
    messages.push(message)

    let update: WSServerMessage = {
      type: 'room_message',
      room_id: room_id,
      ...message,
    }
    let members = roomMembers.get(room_id)
    if (!members) {
      return { notify_count: 0 }
    }
    for (let session of members) {
      session.ws.send(update)
    }
    return { notify_count: members.size }
  },
})

defAPI({
  name: 'getChatMessages',
  inputParser: object({
    room_id: id(),
  }),
  outputParser: object({
    messages: array(
      object({ sender_id: id(), content: string(), timestamp: int() }),
    ),
    total_count: int(),
  }),
  jwt: false,
  fn(input) {
    let room_id = input.room_id
    let messages = roomMessages.get(room_id) || []
    return {
      messages: messages.slice(-100),
      total_count: messages.length,
    }
  },
})

defWSHandler('join_room', (event, session, wss) => {
  let members = roomMembers.get(event.room_id)
  if (!members) {
    members = new Set()
    roomMembers.set(event.room_id, members)
  }
  members.add(session)
})

defWSHandler('leave_room', (event, session, wss) => {
  let members = roomMembers.get(event.room_id)
  if (!members) return
  members.delete(session)
})

chatModule.saveClient()

export default chatModule
