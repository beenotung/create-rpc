import cors from 'cors'
import express from 'express'
import core from './core'
import uploads from './uploads'

export let app = express()

app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(core.apiPrefix, core.router)
app.use(uploads.apiPrefix, uploads.router)
app.get('/', (req, res) => res.redirect('/upload.html'))
