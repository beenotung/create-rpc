import { Request } from 'express'
import httpStatus from 'http-status'
import jwt from 'jwt-simple'
import { Bearer } from 'permit'
import { env } from './env'
import { HttpError } from './http.error'

export type JWTPayload = {
  id: number
  is_admin: boolean
}

const permit = new Bearer({ query: 'access_token' })

export function getJWT(req: Request): JWTPayload {
  let token: string
  try {
    token = permit.check(req)
  } catch (error) {
    throw new HttpError(httpStatus.UNAUTHORIZED, 'invalid Bearer token')
  }
  if (!token) throw new HttpError(httpStatus.UNAUTHORIZED, 'missing JWT Token')
  return decodeJWT(token)
}

function decodeJWT(token: string): JWTPayload {
  try {
    let payload: JWTPayload = jwt.decode(token, env.JWT_SECRET)
    return payload
  } catch (error) {
    throw new HttpError(httpStatus.UNAUTHORIZED, 'invalid JWT token')
  }
}

export function encodeJWT(payload: JWTPayload) {
  return jwt.encode(payload, env.JWT_SECRET)
}

export function checkAdmin(jwt: JWTPayload) {
  if (!jwt.is_admin)
    throw new HttpError(
      httpStatus.FORBIDDEN,
      'This API is only accessible by admin',
    )
}
