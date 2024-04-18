import { getUsersProfile, login, register } from '../src/api/user'
import { getJWTPayload } from '../src/api/utils'

async function main() {
  let out1 = await register({
    body: {
      username: 'alice',
      password: 'secret',
      tags: ['sport', 'food'],
    },
  })
  console.log('register output:', out1)

  let out2 = await login({
    body: {
      username: 'alice',
      password: 'secret',
    },
  })
  console.log('login output:', out2)

  let user_id = getJWTPayload()!.id

  let out3 = await getUsersProfile({
    params: {
      id: user_id,
    },
  })

  console.log('user profile:', out3)
}
main().catch(e => console.error(e))
