import { uploadFiles } from '../src/api/upload-files'

let input = document.createElement('input')
input.type = 'file'
input.multiple = true
input.onchange = async () => {
  if (!input.files) return
  let json = await uploadFiles(input.files)
  console.log(json)
  code.textContent = JSON.stringify(json, null, 2)
  console.log(json.files[0].filename)
}
document.body.appendChild(input)

let pre = document.createElement('pre')
let code = document.createElement('code')
pre.appendChild(code)
document.body.appendChild(pre)
