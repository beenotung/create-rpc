import { Parser } from 'cast.ts'
import { capitalize } from '@beenotung/tslib/string'
import { RouteParameters } from 'express-serve-static-core'
import { Router } from 'express'
import { appendFileSync, unwatchFile, writeFileSync } from 'fs'
import { env } from './env'
import { inspect } from 'util'

export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export function defModule(options: { name: string }) {
  let { name: service } = options

  let router = Router()

  let file = `../client/src/sdk/${service}.ts`
  writeFileSync(
    file,
    `
let api_origin = "http://localhost:${env.PORT}/${service}"

export function getToken() {
  return localStorage.getItem('token')
}

function call(method: string, href: string, body?: object) {
  let url = api_origin + href
  let p = method == 'GET'
    ? fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + getToken(),
        'Accept': 'application/json',
      }
    })
    : fetch(url, {
      method,
      headers: {
        'Authorization': 'Bearer ' + getToken(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
  return p
    .then(res => res.json())
    .catch(e => ({error: String(e)}))
    .then(json => json.error ? Promise.reject(json.error) : json)
}
`,
  )

  function defAPI<
    Path extends string,
    Params = RouteParameters<Path>,
    Input = {},
    Output = {},
  >(
    method: Method,
    url: Path,
    options?: {
      name?: string
      input?: Parser<Input>
      output?: Parser<Output>
      fn?: (input: Input, params: Params) => Output | Promise<Output>
    },
  ) {
    let name =
      options?.name ||
      method.toLowerCase() +
        url
          .split('/')
          .filter(s => s && s[0] != ':')
          .map(s => capitalize(s))
          .join('')

    let Input = name[0].toUpperCase() + name.slice(1) + 'Input'
    let Output = options?.output
      ? name[0].toUpperCase() + name.slice(1) + 'Output'
      : '{}'

    let params = url
      .split('/')
      .filter(s => s[0] == ':')
      .map(s => s.slice(1))

    let apiArgs = params.map(s => s + ': number | string')

    let fetchURL =
      '`' +
      url
        .split('/')
        .map(s => (s[0] == ':' ? '${' + s.slice(1) + '}' : s))
        .join('/')

    let body = method == 'POST' || method == 'PATCH'

    if (!body && options?.input) {
      fetchURL += '?` + new URLSearchParams(input)'
    } else {
      fetchURL += '`'
    }

    let fetchArgs = [`'${method}'`, fetchURL]

    if (options?.input) {
      apiArgs.push('input: ' + Input)
      if (method == 'POST' || method == 'PATCH') {
        fetchArgs.push('input')
      } else {
      }
    }

    let lines: string[] = []
    if (options?.input) {
      lines.push(`export type ${Input} = ${options.input.type}`)
    }
    if (options?.output) {
      lines.push(`export type ${Output} = ${options.output.type}`)
    }
    lines.push(
      `
export function ${name}(${apiArgs.join(', ')}): Promise<${Output}> {
  return call(${fetchArgs.join(', ')})
}
`.trim(),
    )
    appendFileSync(file, '\n' + lines.join('\n') + '\n')

    router.get('/af/:id', req => {})

    router[method.toLowerCase() as 'post'](url, async (req, res, next) => {
      try {
        let input = options?.input?.parse(req) || ({} as Input)
        let output = await options?.fn?.(input, req.params as Params)
        res.json(output)
      } catch (error) {
        next(error)
      }
    })
  }

  return { defAPI, router }
}
