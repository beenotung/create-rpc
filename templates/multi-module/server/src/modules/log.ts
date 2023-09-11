import httpStatus from 'http-status'
import { defModule } from '../api'
import { db } from '../db'
import { checkAdmin } from '../jwt'

let apis = defModule({ name: 'log' })

let { defAPI } = apis

let select_recent_log = db.prepare(/* sql */ `
select
  log.id
, log.user_id
, user.username
, log.created_at as timestamp
, log.rpc
, log.input
from user
inner join log on log.user_id = user.id
where user.username like :username
  and log.id < :last_log_id
order by log.id desc
limit :limit
`)
let count_recent_log = db
  .prepare(
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
defAPI({
  name: 'getRecentLogs',
  jwt: true,
  sampleInput: { limit: 5, last_log_id: 0, username: 'alice' },
  sampleOutput: {
    users: [
      {
        id: 1,
        user_id: 1,
        username: 'alice',
        timestamp: '2023-03-29 08:00:00',
        rpc: 'getRecentUserList',
        input: '{"keyword":"alice"}',
      },
    ],
    remains: 3,
  },
  fn(input, jwt) {
    checkAdmin(jwt)
    let users = select_recent_log.all({
      username: '%' + input.username + '%',
      last_log_id: input.last_log_id,
      limit: Math.min(25, input.limit),
    })
    let remains = count_recent_log.get({
      username: '%' + input.username + '%',
      last_log_id: input.last_log_id,
    }) as number
    remains -= users.length
    return { users, remains }
  },
})

apis.saveClient()

export default apis
