import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import type { Token } from './parse/cst.ts'
import { prettyToken } from './parse/cst.ts'
import { lex } from './parse/lexer.ts'
import { Parser } from './parse/parser.ts'
import { Composer } from './compose/composer.ts'
import { LineCounter } from './parse/line-counter.ts'
import type { Document } from './doc/Document.ts'
import { prettifyError } from './errors.ts'
import type { visitor } from './visit.ts'
import { visit } from './visit.ts'

export const help = `\
yaml: A command-line YAML processor and inspector

Reads stdin and writes output to stdout and errors & warnings to stderr.

Usage:
  yaml          Process a YAML stream, outputting it as YAML
  yaml cst      Parse the CST of a YAML stream
  yaml lex      Parse the lexical tokens of a YAML stream
  yaml valid    Validate a YAML stream, returning 0 on success

Options:
  --help, -h    Show this message.
  --json, -j    Output JSON.
  --indent 2    Output pretty-printed data, indented by the given number of spaces.
  --merge, -m   Enable support for "<<" merge keys.

Additional options for bare "yaml" command:
  --doc, -d     Output pretty-printed JS Document objects.
  --single, -1  Require the input to consist of a single YAML document.
  --strict, -s  Stop on errors.
  --visit, -v   Apply a visitor to each document (requires a path to import)
  --yaml 1.1    Set the YAML version. (default: 1.2)`

export class UserError extends Error {
  static ARGS = 2
  static SINGLE = 3
  code: number
  constructor(code: number, message: string) {
    super(`Error: ${message}`)
    this.code = code
  }
}

export async function cli(
  stdin: NodeJS.ReadableStream,
  done: (error?: Error) => void,
  argv?: string[]
) {
  let args
  try {
    args = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        doc: { type: 'boolean', short: 'd' },
        help: { type: 'boolean', short: 'h' },
        indent: { type: 'string', short: 'i' },
        merge: { type: 'boolean', short: 'm' },
        json: { type: 'boolean', short: 'j' },
        single: { type: 'boolean', short: '1' },
        strict: { type: 'boolean', short: 's' },
        visit: { type: 'string', short: 'v' },
        yaml: { type: 'string', default: '1.2' }
      }
    })
  } catch (error) {
    return done(new UserError(UserError.ARGS, (error as Error).message))
  }

  const {
    positionals: [mode],
    values: opt
  } = args

  let indent = Number(opt.indent)

  stdin.setEncoding('utf-8')

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  switch (opt.help || mode) {
    /* istanbul ignore next */
    case true: // --help
      console.log(help)
      break

    case 'lex': {
      const chunks: string[] = []
      stdin.on('data', chunk => chunks.push(chunk))
      stdin.on('end', () => {
        const data: string[] = []
        for (const tok of lex(chunks.join(''))) {
          if (opt.json) data.push(tok)
          else console.log(prettyToken(tok))
        }
        if (opt.json) console.log(JSON.stringify(data, null, indent))
        done()
      })
      break
    }

    case 'cst': {
      const chunks: string[] = []
      stdin.on('data', chunk => chunks.push(chunk))
      stdin.on('end', () => {
        const data: Token[] = []
        for (const tok of new Parser().parse(chunks.join(''))) {
          if (opt.json) data.push(tok)
          else console.dir(tok, { depth: null })
        }
        if (opt.json) console.log(JSON.stringify(data, null, indent))
        done()
      })
      break
    }

    case undefined:
    case 'valid': {
      const visitor: visitor | null = opt.visit
        ? (await import(resolve(opt.visit))).default
        : null
      let source = ''
      stdin.on('data', chunk => (source += chunk))
      stdin.on('end', () => {
        const lineCounter = new LineCounter()
        // @ts-expect-error Version is validated at runtime
        const composer = new Composer({ version: opt.yaml, merge: opt.merge })
        const parser = new Parser(lineCounter.addNewLine)
        let hasDoc = false
        let reqDocEnd = false
        const data: Document[] = []
        for (const tok of parser.parse(source)) composer.next(tok)
        for (const doc of composer.end(false)) {
          if (hasDoc && opt.single) {
            const msg = 'Input stream contains multiple documents'
            return done(new UserError(UserError.SINGLE, msg))
          }
          for (const error of doc.errors) {
            prettifyError(source, lineCounter)(error)
            if (opt.strict || mode === 'valid') return done(error)
            console.error(error)
          }
          for (const warning of doc.warnings) {
            prettifyError(source, lineCounter)(warning)
            console.error(warning)
          }
          if (visitor) visit(doc, visitor)
          if (mode === 'valid') doc.toJS()
          else if (opt.json) data.push(doc)
          else if (opt.doc) {
            Object.defineProperties(doc, {
              options: { enumerable: false },
              schema: { enumerable: false }
            })
            console.dir(doc, { depth: null })
          } else {
            if (reqDocEnd) console.log('...')
            try {
              indent ||= 2
              const str = doc.toString({ indent })
              console.log(str.endsWith('\n') ? str.slice(0, -1) : str)
            } catch (error) {
              done(error as Error)
            }
          }
          hasDoc = true
          reqDocEnd = !doc.directives?.docEnd
        }
        if (opt.single && !hasDoc) {
          const msg = 'Input stream contained no documents'
          return done(new UserError(UserError.SINGLE, msg))
        }
        if (mode !== 'valid' && opt.json) {
          console.log(JSON.stringify(opt.single ? data[0] : data, null, indent))
        }
        done()
      })
      break
    }

    default: {
      const msg = `Unknown command: ${JSON.stringify(mode)}`
      done(new UserError(UserError.ARGS, msg))
    }
  }
}
