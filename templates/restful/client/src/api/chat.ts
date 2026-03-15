// This file is generated automatically
// Don't edit this file directly

import { call, toParams } from './utils'

export let api_origin = '/api'

// POST /api/chat/:room_id/messages
export function sendChatMessage(input: SendChatMessageInput): Promise<SendChatMessageOutput & { error?: string }> {
  let { params } = input
  return call('POST', api_origin + `/chat/${params.room_id}/messages`, input.body)
}
export type SendChatMessageInput = {
  params: {
    room_id: number
  }
  body: {
    message: string
  }
}
export type SendChatMessageOutput = {
  notify_count: number
}

// GET /api/chat/:room_id/messages
export function getChatMessages(input: GetChatMessagesInput): Promise<GetChatMessagesOutput & { error?: string }> {
  let { params } = input
  return call('GET', api_origin + `/chat/${params.room_id}/messages`)
}
export type GetChatMessagesInput = {
  params: {
    room_id: number
  }
}
export type GetChatMessagesOutput = {
  messages: Array<{
    sender_id: number
    content: string
    timestamp: number
  }>
  total_count: number
}
