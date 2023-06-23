import { server_origin } from './sdk'

export type UploadFilesOutput = {
  error?: string
  filenames: string[]
}

export async function uploadFiles(
  files: FileList | File[],
): Promise<UploadFilesOutput> {
  try {
    let formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i])
    }
    let res = await fetch(server_origin + '/uploads', {
      method: 'POST',
      body: formData,
    })
    let json = await res.json()
    return json
  } catch (error) {
    return {
      error: String(error),
      filenames: [],
    }
  }
}

export function toUploadedFileUrl(filename: string): string {
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename
  }
  return server_origin + '/uploads/' + filename
}
