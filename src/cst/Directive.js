import { Type } from '../constants'
import Node from './Node'
import Range from './Range'

export default class Directive extends Node {
  static endOfDirective(src, offset) {
    let ch = src[offset]
    while (ch && ch !== '\n' && ch !== '#') ch = src[(offset += 1)]
    // last char can't be whitespace
    ch = src[offset - 1]
    while (ch === ' ' || ch === '\t') {
      offset -= 1
      ch = src[offset - 1]
    }
    return offset
  }

  constructor() {
    super(Type.DIRECTIVE)
    this.name = null
  }

  get parameters() {
    const raw = this.rawValue
    return raw ? raw.trim().split(/[ \t]+/) : []
  }

  parseName(start) {
    const { src } = this.context
    let offset = start
    let ch = src[offset]
    while (ch && (ch !== '\n' && ch !== '\t' && ch !== ' '))
      ch = src[(offset += 1)]
    this.name = src.slice(start, offset)
    return offset
  }

  parseParameters(start) {
    const { src } = this.context
    let offset = start
    let ch = src[offset]
    while (ch && ch !== '\n' && ch !== '#') ch = src[(offset += 1)]
    this.valueRange = new Range(start, offset)
    return offset
  }

  parse(context, start) {
    this.context = context
    let offset = this.parseName(start + 1)
    offset = this.parseParameters(offset)
    offset = this.parseComment(offset)
    this.range = new Range(start, offset)
    return offset
  }
}
