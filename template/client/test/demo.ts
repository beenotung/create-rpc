import { createPost, getPostList, signin, signup } from '../src/sdk'

async function main() {
  let { token } = await signup({ username: 'alice', password: 'secret' }).catch(
    () => signin({ username: 'alice', password: 'secret' }),
  )
  console.log({ token })
  for (;;) {
    let newPost = await createPost({
      token,
      content: 'demo post at ' + new Date(),
    })
    console.log('new post id:', newPost.id)
    if (newPost.id > 10) break
  }
  let { posts } = await getPostList({
    keyword: 'demo',
    last_post_id: 5,
    limit: 5,
  })
  console.log({ posts })
}
main().catch(e => console.error(e))
