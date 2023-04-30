import { getRecentUserList, getToken, login } from '../src/sdk'

async function main() {
  // console.log(await login({} as any)) // server will reject with TypeError

  await login({ username: 'alice', password: 'secret' })
  await login({ username: 'admin', password: 'secret' })

  let { users, remains } = await getRecentUserList({
    keyword: 'a',
    last_log_id: Number.MAX_SAFE_INTEGER,
    limit: 3,
    token: getToken()!,
  })
  console.log({ users, remains })
}
main().catch(e => console.error(e))
