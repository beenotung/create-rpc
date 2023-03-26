import { config } from 'dotenv'
import populateEnv from 'populate-env'

config()

export let env = {
  ORIGIN: 'http://localhost:3000',
  PORT: 3000,
  JWT_SECRET: '',
}

populateEnv(env, { mode: 'halt' })
