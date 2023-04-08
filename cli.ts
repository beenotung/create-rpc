#!/usr/bin/env node

import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { copyTemplate, getDest } from 'npm-init-helper'
import { join } from 'path'

async function main() {
  let dest = await getDest()
  let srcDir = join(__dirname, 'template')
  console.log('Copying rpc template to:', dest, '...')
  await copyTemplate({ srcDir, dest, updatePackageJson: false })

  let readme = readFileSync(join(__dirname, 'README.md')).toString()

  let idx = readme.indexOf(
    'Inside the server directory, you can run several commands:',
  )

  let commandsMessage = readme
    .slice(idx)
    .split('```')[1]
    .trim()
    .split('\n')
    .map(line => {
      line = line.replace('\r', '')
      if (line.trim().length === 0) {
        return line
      }
      return '  ' + line
    })
    .join('\n')

  let helpMessage = `
Inside the server directory, you can run several commands:

${commandsMessage}


Get started by typing:

  cd ${dest}/server
  pnpm i
  npm run db:setup
  npm start


Installation Alternatives:

  pnpm i
  or
  yarn install
  or
  npm install
`

  writeFileSync(join(dest, 'help.txt'), helpMessage.trimStart())

  let envCode = readFileSync(join(dest, 'server', '.env.example'))
    .toString()
    .replace('JWT_SECRET=', 'JWT_SECRET=replaceThisToASecret')
  writeFileSync(join(dest, 'server', '.env'), envCode)

  rename_gitignore(join(dest, 'server'))
  rename_gitignore(join(dest, 'client'))

  console.log(
    `
Done.

Created ${dest}/server and ${dest}/client.

${helpMessage.trim()}
`.trim(),
  )
}

function rename_gitignore(dir: string) {
  let src = join(dir, 'gitignore.txt')
  if (!existsSync(src)) return
  let dest = join(dir, '.gitignore')
  renameSync(src, dest)
}

main().catch(e => console.error(e))
