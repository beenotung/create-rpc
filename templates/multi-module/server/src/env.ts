import { config } from 'dotenv'
import populateEnv from 'populate-env'
import { randomUUID } from 'crypto'
import { appendFileSync } from 'fs'

config()

export let env = {
  NODE_ENV: 'development',
  ORIGIN: 'http://localhost:3000',
  PORT: 3000,
  JWT_SECRET: process.env.JWT_SECRET || '',
}

if (!env.JWT_SECRET) {
  env.JWT_SECRET = randomUUID()
  let line = 'JWT_SECRET=' + env.JWT_SECRET
  appendFileSync('.env', '\n' + line + '\n')
}

populateEnv(env, { mode: 'halt' })
