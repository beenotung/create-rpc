import { find } from 'better-sqlite3-proxy'
import { defModule } from './api'
import { db } from './db'
import { HttpError } from './error'
import { hashPassword, comparePassword } from './hash'
import { encodeJWT } from './jwt'
import { proxy } from './proxy'

export let core = defModule()

let { defAPI } = core

defAPI({
  name: 'signup',
  sampleInput: {
    username: 'alice',
    password: 'secret',
  },
  sampleOutput: { token: 'jwt' },
  fn: async input => {
    let user = find(proxy.user, { username: input.username })
    if (user) throw new HttpError(409, 'this username is already in use')
    let id = proxy.user.push({
      username: input.username,
      password_hash: await hashPassword(input.password),
    })
    let token = encodeJWT({ id })
    return { token }
  },
})

defAPI({
  name: 'signin',
  sampleInput: {
    username: 'alice',
    password: 'secret',
  },
  sampleOutput: { token: 'jwt' },
  async fn(input) {
    let user = find(proxy.user, { username: input.username })
    if (!user) throw new HttpError(404, 'this username is not used')
    let matched = await comparePassword({
      password: input.password,
      password_hash: user.password_hash,
    })
    if (!matched) throw new HttpError(401, 'wrong username or password')
    let token = encodeJWT({ id: user.id! })
    return { token }
  },
})

defAPI({
  name: 'createPost',
  sampleInput: { content: 'hello world' },
  sampleOutput: { id: 1 },
  jwt: true,
  fn(input, jwt) {
    let user_id = jwt.id
    let id = proxy.post.push({ user_id, content: input.content })
    return { id }
  },
})

let select_post_list = db.prepare(/* sql */ `
select
  post.id
, post.user_id
, user.username
, post.content
from post
inner join user on user.id = post.user_id
where content like :keyword
  and post.id > :last_post_id
order by post.id asc
limit :limit
`)
let count_post_list = db
  .prepare(
    /* sql */ `
select
  count(*) as count
from post
inner join user on user.id = post.user_id
where content like :keyword
  and post.id > :last_post_id
`,
  )
  .pluck()
defAPI({
  name: 'getPostList',
  sampleInput: { limit: 5, last_post_id: 0, keyword: 'hello' },
  sampleOutput: {
    posts: [{ id: 1, user_id: 1, username: 'alice', content: 'hello world' }],
    remains: 3,
  },
  fn(input) {
    let posts = select_post_list.all({
      keyword: '%' + input.keyword + '%',
      last_post_id: input.last_post_id,
      limit: Math.min(25, input.limit),
    })
    let remains = count_post_list.get({
      keyword: '%' + input.keyword + '%',
      last_post_id: input.last_post_id,
    })
    remains -= posts.length
    return { posts, remains }
  },
})

core.saveSDK()
