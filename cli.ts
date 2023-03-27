#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { copyTemplate, getDest } from 'npm-init-helper'
import { join } from 'path'

async function main() {
  let dest = await getDest()
  let srcDir = join(__dirname, 'template')
  console.log('Copying rpc template to:', dest, '...')
  await copyTemplate({ srcDir, dest, updatePackageJson: false })
  let helpMessage = `
Inside the server directory, you can run several commands:

  npm start
    Starts the auto-refresh development server.
    It auto generates the client/src/sdk.ts based on the APIs defined in server/src/core.ts.

  npm run db:setup
    Migrate the database schema to latest version.

  npm run db:plan
    Auto-generate migration based on erd.txt and current database schema.

  npm run db:update
    Apply the new migration plan, and update the proxy.ts based on the erd.txt.

  npm run build
    Builds the web project into 'build' folder.


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

  console.log(
    `
Done.

Created ${dest}/server and ${dest}/client.

${helpMessage.trim()}
`.trim(),
  )
}

main().catch(e => console.error(e))
