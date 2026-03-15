import cors from 'cors'
import express, { Router } from 'express'
import { userModule } from './modules/user'
import { demoModule } from './modules/demo'
import { logModule } from './modules/log'
import uploads from './uploads'

export let app = express()

function attachApp(api: { apiPrefix: string; router: Router }) {
  app.use(api.apiPrefix, api.router)
}

app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

attachApp(uploads)
attachApp(userModule)
attachApp(demoModule)
attachApp(logModule)
