import { proxySchema } from 'better-sqlite3-proxy'
import { db } from './db'

export type User = {
  id?: number | null
  username: string
  password_hash: string
}

export type Post = {
  id?: number | null
  content: string
  user_id: number
  user?: User
}

export type DBProxy = {
  user: User[]
  post: Post[]
}

export let proxy = proxySchema<DBProxy>({
  db,
  tableFields: {
    user: [],
    post: [
      /* foreign references */
      ['user', { field: 'user_id', table: 'user' }],
    ],
  },
})
