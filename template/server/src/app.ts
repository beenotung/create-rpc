import express from 'express'
import { core } from './core'

export let app = express()

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(core.apiPrefix, core.router)
