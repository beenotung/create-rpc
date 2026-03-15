import { Application, ErrorRequestHandler } from 'express'
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export function attachErrorHandling(app: Application) {
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
}
