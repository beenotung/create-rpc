import crypto from 'crypto'
import express from 'express'
import formidable from 'formidable'
import { mkdirSync } from 'fs'

let router = express.Router()

let uploadDir = 'uploads'
let apiPrefix = '/uploads'

mkdirSync(uploadDir, { recursive: true })

router.post('/', (req, res) => {
  let form = formidable({
    uploadDir,
    filter: part => part.name === 'file',
    multiples: true,
    filename: (name, ext, part, form) => {
      let extname = part.mimetype?.split('/').pop()?.split(';')[0]
      let filename = crypto.randomUUID()
      return `${filename}.${extname}`
    },
  })
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(400)
      res.json({ error: String(err) })
      return
    }
    let file = files.file
    let fileList = Array.isArray(file) ? file : file ? [file] : []
    let filenames = fileList.map(file => file.newFilename)
    res.json({ filenames })
  })
})

router.use(express.static(uploadDir))

let uploads = {
  router,
  apiPrefix,
}

export default uploads
