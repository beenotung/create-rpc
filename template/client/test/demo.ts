import { signin, getRecentUserList, getToken } from '../src/sdk'

async function main() {
  await signin({ username: 'alice', password: 'secret' })
  await signin({ username: 'admin', password: 'secret' })

  let { users, remains } = await getRecentUserList({
    keyword: 'a',
    last_log_id: Number.MAX_SAFE_INTEGER,
    limit: 3,
    token: getToken()!,
  })
  console.log({ users, remains })
}
main().catch(e => console.error(e))
