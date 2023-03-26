import { compare, hash } from 'bcryptjs'

// deepcode ignore HardcodedSecret: this is number of round, not fixed salt
const ROUND = 12

export function hashPassword(password: string): Promise<string> {
  return hash(password, ROUND)
}

export function comparePassword(options: {
  password: string
  password_hash: string
}): Promise<boolean> {
  return compare(options.password, options.password_hash)
}
