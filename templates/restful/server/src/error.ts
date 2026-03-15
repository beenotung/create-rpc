import { Application, ErrorRequestHandler } from 'express'
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    message = HttpError.toString(message)
    super(message)
  }

  static from(error: unknown) {
    if (error && typeof error === 'object') {
      let err = error as any
      if (err.statusCode) {
        return err
      }
      if (err.status) {
        return new HttpError(err.status, err.message || String(err))
      }
    }
    return new HttpError(500, String(error))
  }

  static toString(error: unknown) {
    return String(error)
      .replace(/^(\w*)Error: /, '')
      .trim()
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
    let error = HttpError.toString(err)
    if (req.headers.accept?.includes('application/json')) {
      res.json({ error })
    } else {
      res.end(error)
    }
  }
  app.use(errorHandler)
}
