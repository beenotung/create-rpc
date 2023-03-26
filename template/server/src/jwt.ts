import { HTTPError } from './error'
import jwt from 'jwt-simple'
import { env } from './env'

export type JWTPayload = {
  id: number
}

export function decodeJWT(token: string): JWTPayload {
  try {
    let payload: JWTPayload = jwt.decode(token, env.JWT_SECRET)
    return payload
  } catch (error) {
    throw new HTTPError(403, 'invalid jwt token')
  }
}

export function encodeJWT(payload: JWTPayload) {
  return jwt.encode(payload, env.JWT_SECRET)
}
