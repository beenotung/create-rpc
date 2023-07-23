// This file is generated automatically
// Don't edit this file directly

import { post } from './utils'

let api_origin = '/api/log'

export type GetRecentLogsInput = {
  limit: number
  last_log_id: number
  username: string
}
export type GetRecentLogsOutput = {
  users: Array<{
    id: number
    user_id: number
    username: string
    timestamp: string
    rpc: string
    input: string
  }>
  remains: number
}
export function getRecentLogs(input: GetRecentLogsInput & { token: string }): Promise<GetRecentLogsOutput & { error?: string }> {
  let { token, ...body } = input
	return post(api_origin + '/getRecentLogs', body, token)
}
