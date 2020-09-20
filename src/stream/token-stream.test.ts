import { TokenStream } from './token-stream.js'

export function test(src: string) {
  const tokens: string[] = []
  const ts = new TokenStream()
    .on('data', chunk => {
      tokens.push(chunk)
    })
    .on('error', error => {
      throw error
    })
  ts.write(src)
  ts.end()
  return tokens
}
