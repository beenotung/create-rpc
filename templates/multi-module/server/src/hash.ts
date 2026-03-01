import { hash, verify } from 'argon2'

export function hashPassword(password: string): Promise<string> {
  return hash(password)
}

export function comparePassword(options: {
  password: string
  password_hash: string
}): Promise<boolean> {
  return verify(options.password_hash, options.password)
}
