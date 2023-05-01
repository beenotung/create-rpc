import { proxySchema } from 'better-sqlite3-proxy'
import { db } from './db'

export type User = {
  id?: null | number
  username: string
  password_hash: string
  is_admin: boolean
}

export type Log = {
  id?: null | number
  user_id: null | number
  user?: User
  rpc: string
  input: string // json
  output: string // json
  time_used: number
  user_agent: null | string
}

export type DBProxy = {
  user: User[]
  log: Log[]
}

export let proxy = proxySchema<DBProxy>({
  db,
  tableFields: {
    user: [],
    log: [
      /* foreign references */
      ['user', { field: 'user_id', table: 'user' }],
    ],
  },
})
