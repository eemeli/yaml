import { ParseStream } from './parse-stream.js'
import { Parser } from './parser.js'

export function stream(source: string) {
  const ps = new ParseStream().on('data', d => console.dir(d, { depth: null }))
  ps.write(source)
  ps.end()
}

export function sync(source: string) {
  const parser = new Parser(t => console.dir(t, { depth: null }))
  parser.parse(source)
}
