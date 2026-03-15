import { id, int, literal, object, optional, or, Parser, string } from 'cast.ts'
import { saveWsTypes } from '../api'

export let wsClientMessageParser = or([
  object({
    type: literal('join_room'),
    room_id: id(),
  }),
  object({
    type: literal('leave_room'),
    room_id: id(),
  }),
])

export let wsServerMessageParser = or([
  object({
    type: literal('error'),
    message: string(),
  }),
  object({
    type: literal('room_join'),
    user_id: id(),
  }),
  object({
    type: literal('room_leave'),
    user_id: id(),
  }),
  object({
    type: literal('room_message'),
    room_id: id(),
    sender_id: id(),
    content: string(),
    timestamp: int(),
  }),
])

saveWsTypes({
  wsClientMessageParser,
  wsServerMessageParser,
})
