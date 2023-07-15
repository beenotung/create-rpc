import crypto from 'crypto'
import express from 'express'
import formidable from 'formidable'
import { mkdirSync } from 'fs'
import { proxy } from './proxy'

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
    try {
      let file = files.file
      let fileList = Array.isArray(file) ? file : file ? [file] : []
      res.json({
        files: fileList.map(file => {
          let row = {
            filename: file.newFilename,
            size: file.size,
            mimetype: file.mimetype || 'application/octet-stream',
          }
          let id = proxy.file.push(row)
          return { id, ...row }
        }),
      })
    } catch (error) {
      res.status(500)
      res.json({ error: String(error) })
    }
  })
})

router.use(express.static(uploadDir))

let uploads = {
  router,
  apiPrefix,
}

export default uploads
