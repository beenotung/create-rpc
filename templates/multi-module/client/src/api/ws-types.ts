// This file is generated automatically
// Don't edit this file directly

export const Ping = '1'
export const Pong = '2'
export const Send = '3'

export type WSClientMessage = ({
  type: "join_room"
  room_id: number
} | {
  type: "leave_room"
  room_id: number
})

export type WSServerMessage = ({
  type: "error"
  message: string
} | {
  type: "room_join"
  user_id: number
} | {
  type: "room_leave"
  user_id: number
} | {
  type: "room_message"
  room_id: number
  sender_id: number
  content: string
  timestamp: number
})
