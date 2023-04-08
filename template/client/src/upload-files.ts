import { server_origin } from './sdk'

export type UploadFilesOutput = {
  error?: string
  filenames: string[]
}

export async function uploadFiles(
  files: FileList | File[],
): Promise<UploadFilesOutput> {
  let formData = new FormData()
  for (let file of files) {
    formData.append('file', file)
  }
  let res = await fetch(server_origin + '/uploads', {
    method: 'POST',
    body: formData,
  })
  let json = await res.json()
  return json
}
