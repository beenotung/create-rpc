import { int, object, optional, string } from 'cast.ts'
import { defModule } from '../api'
import { db } from '../db'

export let logModule = defModule({ name: 'log', apiPrefix: '/api/log' })
let { defAPI } = logModule

let select_recent_log = db.prepare<
  {
    username: string
    last_log_id: number
    limit: number
  },
  {
    id: number
    user_id: number
    username: string
    timestamp: string
    rpc: string
    input: string
  }
>(/* sql */ `
select
  log.id
, log.user_id
, user.username
, log.created_at as timestamp
, log.method || ' ' || log.url as rpc
, log.input
from user
inner join log on log.user_id = user.id
where user.username like :username
  and log.id < :last_log_id
order by log.id desc
limit :limit
`)
let count_recent_log = db
  .prepare<
    {
      username: string
      last_log_id: number
    },
    number
  >(
    /* sql */ `
select
  count(*) as count
from user
inner join log on log.user_id = user.id
where user.username like :username
  and log.id < :last_log_id
`,
  )
  .pluck()

defAPI('GET', '/recent', {
  name: 'getRecentLogs',
  inputParser: object({
    query: object({
      username: optional(string()),
      last_log_id: optional(int({ min: 1 })),
      limit: optional(int({ min: 1, max: 25 })),
    }),
  }),
  sampleOutput: {
    users: [
      {
        id: 1,
        user_id: 1,
        username: 'alice',
        timestamp: '2023-03-29 08:00:00',
        rpc: 'POST /api/users/login',
        input: '{"body":{"username":"alice","password":"******"}}',
      },
    ],
    remains: 3,
  },
  jwt: true,
  role: 'admin',
  fn(input) {
    let users = select_recent_log.all({
      username: '%' + (input.query.username || '') + '%',
      last_log_id: input.query.last_log_id || Number.MAX_SAFE_INTEGER,
      limit: input.query.limit || 5,
    })
    let remains = count_recent_log.get({
      username: '%' + (input.query.username || '') + '%',
      last_log_id: input.query.last_log_id || Number.MAX_SAFE_INTEGER,
    }) as number
    remains -= users.length
    return { users, remains }
  },
})

logModule.saveClient()
