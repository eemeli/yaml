import { Transform, TransformOptions } from 'stream'
import { StringDecoder } from 'string_decoder'
import { CSTParser } from './cst-parser.js'

export type ParseStreamOptions = Omit<
  TransformOptions,
  'decodeStrings' | 'emitClose' | 'objectMode'
>

export class CSTStream extends Transform {
  decoder: StringDecoder
  parser: CSTParser

  constructor(options: ParseStreamOptions = {}) {
    super({
      ...options,
      decodeStrings: false,
      emitClose: true,
      objectMode: true
    })
    this.decoder = new StringDecoder(options.defaultEncoding || 'utf8')
    this.parser = new CSTParser(token => this.push(token))
  }

  _flush(done: (error?: Error) => void) {
    this.parser.parse('', false)
    done()
  }

  _transform(chunk: string | Buffer, _: any, done: (error?: Error) => void) {
    try {
      const src = Buffer.isBuffer(chunk) ? this.decoder.write(chunk) : chunk
      this.parser.parse(src, true)
      done()
    } catch (error) {
      done(error) // should never happen
    }
  }
}
