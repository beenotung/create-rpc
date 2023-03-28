# create-rpc

Starter template of Typescript web server with auto-generated client SDK using RPC with ajax.

[![npm Package Version](https://img.shields.io/npm/v/create-rpc.svg)](https://www.npmjs.com/package/create-rpc)

## Usage

```bash
npm init rpc [project-name]
# or
npx create-rpc [project-name]
```

## Template Features

- Auto-generate client SDK in Typescript
- Auto-generate (knex) database migration with quick-erd
- Typed array-like ORM with better-sqlite3-proxy
- Hashing password with bcrypt
- JWT generation
- Auto-storing JWT token
- Dotenv setup

## Available Commands

Inside the server directory, you can run several commands:

```
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
  Builds the web project into 'dist' folder.
```

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
