import { getRecentLogs } from '../src/api/log'
import { login, searchUsers } from '../src/api/user'

async function main() {
  // console.log(await login({} as any)) // server will reject with TypeError
  console.log('searchUsers:')
  console.dir(await searchUsers({ query: {} }), { depth: 20 })

  await login({
    body: {
      username: 'alice',
      password: 'secret',
    },
  })
  await login({
    body: {
      username: 'admin',
      password: 'secret',
    },
  })

  let { users, remains } = await getRecentLogs({
    query: {
      username: 'a',
      last_log_id: Number.MAX_SAFE_INTEGER, // get latest logs
      // last_log_id: 20, // scrolling backward
      limit: 3,
    },
  })
  console.log({ users, remains })
}
main().catch(e => console.error(e))
