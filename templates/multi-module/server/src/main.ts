import { print } from 'listening-on'
import { app } from './app'
import { env } from './env'

app.listen(env.PORT, () => {
  print(env.PORT)
})
