import { getToken } from '../src/api/utils'
import { getRecentLogs } from '../src/api/log'
import { getUserList, login } from '../src/api/user'

async function main() {
  // console.log(await login({} as any)) // server will reject with TypeError
  console.log('getUserList:', await getUserList({}))

  await login({ username: 'alice', password: 'secret' })
  await login({ username: 'admin', password: 'secret' })

  let { users, remains } = await getRecentLogs({
    username: 'a',
    last_log_id: Number.MAX_SAFE_INTEGER, // get latest logs
    // last_log_id: 20, // scrolling backward
    limit: 3,
    token: getToken()!,
  })
  console.log({ users, remains })
}
main().catch(e => console.error(e))
