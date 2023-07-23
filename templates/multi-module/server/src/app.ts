import cors from 'cors'
import express, { Router } from 'express'
import demo from './modules/demo'
import log from './modules/log'
import user from './modules/user'
import uploads from './uploads'

export let app = express()

function attachApp(api: { apiPrefix: string; router: Router }) {
  app.use(api.apiPrefix, api.router)
}

app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

attachApp(demo)
attachApp(log)
attachApp(user)
attachApp(uploads)
app.get('/', (req, res) => res.redirect('/upload.html'))
