import { CSTStream } from './cst-stream.js'
import { CSTParser } from './cst-parser.js'

export function stream(source: string) {
  const ps = new CSTStream().on('data', d => console.dir(d, { depth: null }))
  ps.write(source)
  ps.end()
}

export function test(source: string) {
  const lines: number[] = []
  const parser = new CSTParser(
    t => console.dir(t, { depth: null }),
    n => lines.push(n)
  )
  parser.parse(source)
  console.log({ lines })
}
