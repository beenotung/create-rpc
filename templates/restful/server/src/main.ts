import express, { ErrorRequestHandler } from 'express'
import { print } from 'listening-on'
import { env } from './env'
import { HttpError } from './http.error'
import { userModule } from './modules/user'
import cors from 'cors'
import uploads from './uploads'

let app = express()

app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(uploads.apiPrefix, uploads.router)
app.use(userModule.apiPrefix, userModule.router)

app.use((req, res, next) =>
  next(
    new HttpError(
      404,
      `route not found, method: ${req.method}, url: ${req.url}`,
    ),
  ),
)

let errorHandler: ErrorRequestHandler = (err: HttpError, req, res, next) => {
  if (!err.statusCode) console.error(err)
  res.status(err.statusCode || 500)
  let error = String(err).replace(/^(\w*)Error: /, '')
  if (req.headers.accept?.includes('application/json')) {
    res.json({ error })
  } else {
    res.end(error)
  }
}
app.use(errorHandler)

app.listen(env.PORT, () => {
  print(env.PORT)
})
