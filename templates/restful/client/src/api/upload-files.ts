import { server_origin } from './config'
import { getToken } from './utils'

export type UploadedFile = {
  id: number
  filename: string
  size: number
  mimetype: string
}

export type UploadFilesOutput = {
  files: UploadedFile[]
}

export async function uploadFiles(
  files: FileList | File[],
): Promise<UploadFilesOutput> {
  let formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('file', files[i])
  }
  let res = await fetch(server_origin + '/uploads', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + getToken(),
    },
    body: formData,
  })
  let text = await res.text()
  let json: UploadFilesOutput & { error?: string }
  try {
    json = JSON.parse(text)
  } catch {
    let error = res.status.toString()
    if (res.statusText) error += ' ' + res.statusText
    if (text) error += ': ' + text
    throw error
  }
  if (json.error) {
    throw json.error
  }
  return json
}

export function toUploadedFileUrl(filename: string): string {
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename
  }
  return server_origin + '/uploads/' + filename
}
