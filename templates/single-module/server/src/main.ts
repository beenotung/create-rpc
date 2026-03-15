import { print } from 'listening-on'
import { env } from './env'
import { app } from './app'
import { attachErrorHandling } from './error'

attachErrorHandling(app)

app.listen(env.PORT, () => {
  print(env.PORT)
})
