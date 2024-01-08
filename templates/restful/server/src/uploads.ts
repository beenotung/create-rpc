import { randomUUID } from 'crypto'
import express from 'express'
import formidable from 'formidable'
import { mkdirSync } from 'fs'
import { proxy } from './proxy'
import { getJWT } from './jwt'
import debug from 'debug'

let log = debug('uploadFiles')
log.enabled = true

let router = express.Router()

let uploadDir = 'uploads'
let apiPrefix = '/uploads'

mkdirSync(uploadDir, { recursive: true })

router.post('/', (req, res) => {
  log('content-length:', req.headers['content-length'])
  let startTime = Date.now()
  let user_id: number | null
  let end = (status: number, output: object) => {
    let endTime = Date.now()
    res.status(status)
    res.json(output)
    proxy.log.push({
      method: 'POST',
      url: apiPrefix,
      input: '',
      output: JSON.stringify(output),
      time_used: endTime - startTime,
      user_id,
      user_agent: req.headers['user-agent'] || null,
    })
  }
  try {
    user_id = getJWT(req).id
    let form = formidable({
      uploadDir,
      filter: part => part.name === 'file',
      multiples: true,
      filename: (name, ext, part, form) => {
        let extname = part.mimetype?.split('/').pop()?.split(';')[0]
        if (extname === 'octet-stream') {
          extname = ''
        }
        extname ||= 'bin'
        let filename = randomUUID()
        return `${filename}.${extname}`
      },
    })
    form.parse(req, (err, fields, files) => {
      try {
        if (err) {
          end(400, { error: String(err) })
          return
        }
        let fileList = files.file || []
        end(200, {
          files: fileList.map(file => {
            let row = {
              user_id: user_id!,
              filename: file.newFilename,
              size: file.size,
              mimetype: file.mimetype || 'application/octet-stream',
              original_filename: file.originalFilename || null,
            }
            let id = proxy.file.push(row)
            return { id, ...row }
          }),
        })
      } catch (error) {
        end(500, { error: String(error) })
      }
    })
  } catch (error) {
    end(500, { error: String(error) })
  }
})

router.use(express.static(uploadDir))

let uploads = {
  router,
  apiPrefix,
  uploadDir,
}

export default uploads
