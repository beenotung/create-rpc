import express from 'express'
import { apiRouter, apiPrefix } from './api'

export let app = express()

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(apiPrefix, apiRouter)
