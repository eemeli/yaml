import { ParseStream } from './parse-stream.js'
import { Parser } from './parser.js'

export function stream(source: string) {
  const ps = new ParseStream().on('data', d => console.dir(d, { depth: null }))
  ps.write(source)
  ps.end()
}

export function test(source: string) {
  const lines: number[] = []
  const parser = new Parser(
    t => console.dir(t, { depth: null }),
    n => lines.push(n)
  )
  parser.parse(source)
  console.log({ lines })
}
