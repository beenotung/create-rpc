import { login } from '../src/sdk'
import { uploadFiles } from '../src/upload-files'

let input = document.createElement('input')
input.type = 'file'
input.multiple = true
input.onchange = async () => {
  if (!input.files) return
  try {
    await login({ username: 'alice', password: 'secret' })
    let json = await uploadFiles(input.files)
    console.log(json)
    code.textContent = JSON.stringify(json, null, 2)
  } catch (error) {
    console.log(error)
    code.textContent = String(error)
  }
}
document.body.appendChild(input)

let pre = document.createElement('pre')
let code = document.createElement('code')
pre.appendChild(code)
document.body.appendChild(pre)
