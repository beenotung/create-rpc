import { randomUUID } from 'crypto'
import express from 'express'
import formidable from 'formidable'
import { mkdirSync } from 'fs'
import { proxy } from './proxy'
import { getJWT } from './jwt'
import debug from 'debug'
import { mimeToExt } from 'mime-detect'
import { env } from './env'
import { join } from 'path'
import { download_file } from '@beenotung/tslib/download-file'
import { HttpError } from './error'

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
        let extname = part.mimetype ? mimeToExt(part.mimetype) : null
        let filename = randomUUID()
        return extname ? `${filename}.${extname}` : filename
      },
    })
    form.parse(req, (err, fields, files) => {
      try {
        if (err) {
          end(400, { error: HttpError.toString(err) })
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
      } catch (err) {
        let error = HttpError.from(err)
        end(error.statusCode, { error: HttpError.toString(error) })
      }
    })
  } catch (err) {
    let error = HttpError.from(err)
    end(error.statusCode, { error: HttpError.toString(error) })
  }
})

let static_router = express.static(uploadDir)
router.use(static_router)
if (env.REMOTE_ORIGIN !== 'skip') {
  router.use(async (req, res, next) => {
    try {
      let remote_url = env.REMOTE_ORIGIN + apiPrefix + req.url
      let local_file = join(uploadDir, req.url)
      await download_file(remote_url, local_file)
      static_router(req, res, next)
    } catch (error) {
      next(error)
    }
  })
}

let uploads = {
  router,
  apiPrefix,
  uploadDir,
}

export default uploads
