import { hashPassword } from './src/hash'
import { proxy } from './src/proxy'

async function main() {
  proxy.user[1] = {
    username: 'admin',
    password_hash: await hashPassword('secret'),
    is_admin: true,
  }
  proxy.user[2] = {
    username: 'alice',
    password_hash: await hashPassword('secret'),
    is_admin: false,
  }
}
main().catch(e => console.error(e))
