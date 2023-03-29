import { HttpError } from './error'
import jwt from 'jwt-simple'
import { Bearer } from 'permit'
import { env } from './env'
import { Request } from 'express'

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
    throw new HttpError(401, 'invalid Bearer token')
  }
  if (!token) throw new HttpError(401, 'missing JWT Token')
  return decodeJWT(token)
}

function decodeJWT(token: string): JWTPayload {
  try {
    let payload: JWTPayload = jwt.decode(token, env.JWT_SECRET)
    return payload
  } catch (error) {
    throw new HttpError(403, 'invalid JWT token')
  }
}

export function encodeJWT(payload: JWTPayload) {
  return jwt.encode(payload, env.JWT_SECRET)
}
