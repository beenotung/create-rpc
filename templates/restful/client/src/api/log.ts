// This file is generated automatically
// Don't edit this file directly

import { call, toParams } from './utils'

export let api_origin = '/api/log'

// GET /api/log/recent
export function getRecentLogs(input: GetRecentLogsInput): Promise<GetRecentLogsOutput & { error?: string }> {
  return call('GET', api_origin + `/recent?` + toParams(input.query))
}
export type GetRecentLogsInput = {
  query: {
    username?: string
    last_log_id?: number
    limit?: number
  }
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
