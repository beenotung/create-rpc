// This file is generated automatically
// Don't edit this file directly

import { post } from './utils'

let api_origin = '/api/chat'

export type SendChatMessageInput = {
  room_id: number
  message: string
}
export type SendChatMessageOutput = {
  notify_count: number
}
export function sendChatMessage(input: SendChatMessageInput & { token: string }): Promise<SendChatMessageOutput & { error?: string }> {
  let { token, ...body } = input
	return post(api_origin + '/sendChatMessage', body, token)
}

export type GetChatMessagesInput = {
  room_id: number
}
export type GetChatMessagesOutput = {
  messages: Array<{
    sender_id: number
    content: string
    timestamp: number
  }>
  total_count: number
}
export function getChatMessages(input: GetChatMessagesInput): Promise<GetChatMessagesOutput & { error?: string }> {
	return post(api_origin + '/getChatMessages', input)
}
