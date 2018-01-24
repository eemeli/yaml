import Comment from './Comment'
import Node from './Node'
import Range from './Range'

export default class Document extends Node {
  static endOfDirective (src, offset) {
    let ch = src[offset]
    while (ch && ch !== '\n' && ch !== '#') ch = src[offset += 1]
    // last char can't be whitespace
    ch = src[offset - 1]
    while (ch === ' ' || ch === '\t') {
      offset -= 1
      ch = src[offset - 1]
    }
    return offset
  }

  static startCommentOrEndBlankLine (src, start) {
    const offset = Node.endOfWhiteSpace(src, start)
    const ch = src[offset]
    return ch === '#' || ch === '\n' ? offset : start
  }

  static atDirectivesEnd (src, offset) {
    return src[offset] === '-' && src[offset + 1] === '-' && src[offset + 2] === '-'
  }

  static atDocumentEnd (src, offset) {
    return !src[offset] || (
      src[offset] === '.' && src[offset + 1] === '.' && src[offset + 2] === '.'
    )
  }

  constructor () {
    super(Node.Type.DOCUMENT)
    this.directives = null
    this.contents = null
  }

  parseDirectives (start) {
    const { src } = this.context
    this.directives = []
    let offset = start
    while (!Document.atDirectivesEnd(src, offset)) {
      offset = Document.startCommentOrEndBlankLine(src, offset)
      const dirStart = offset
      switch (src[offset]) {
        case '\n':
          offset += 1
          break
        case '#': {
          const comment = new Comment()
          offset = comment.parse({ src }, offset)
          this.directives.push(comment)
          trace: 'directive-comment', comment.comment
        } break
        case '%': {
          const directive = new Node(Node.Type.DIRECTIVE, null, { parent: this, src })
          offset = Document.endOfDirective(src, offset + 1)
          directive.valueRange = new Range(dirStart + 1, offset)
          offset = Node.endOfWhiteSpace(src, offset)
          offset = directive.parseComment(offset)
          directive.range = new Range(dirStart, offset)
          this.directives.push(directive)
          trace: 'directive', { valueRange: directive.valueRange, comment: directive.comment }, JSON.stringify(directive.rawValue)
        } break
        default:
          return offset
      }
    }
    return offset + 3
  }

  parseContents (start) {
    const { parseNode, src } = this.context
    this.contents = []
    let lineStart = start
    while (src[lineStart - 1] === '-') lineStart -= 1
    let offset = Node.endOfWhiteSpace(src, start)
    let atLineStart = lineStart === start
    this.valueRange = new Range(offset)
    while (!Document.atDocumentEnd(src, offset)) {
      switch (src[offset]) {
        case '\n':
          offset += 1
          lineStart = offset
          atLineStart = true
          break
        case '#': {
          const comment = new Comment()
          offset = comment.parse({ src }, offset)
          this.contents.push(comment)
          trace: 'content-comment', comment.comment
        } break
        default: {
          const iEnd = Node.endOfIndent(src, offset)
          const context = { atLineStart, indent: -1, inFlow: false, inCollection: false, lineStart, parent: this }
          const node = parseNode(context, iEnd)
          if (!node) return iEnd // at next document start
          this.contents.push(node)
          this.valueRange.end = node.valueRange.end
          offset = node.range.end
          atLineStart = false
          trace: 'content-node', { valueRange: node.valueRange, comment: node.comment }, JSON.stringify(node.rawValue)
        }
      }
      offset = Document.startCommentOrEndBlankLine(src, offset)
    }
    return src[offset] ? offset + 3 : offset
  }

  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */
  parse (context, start) {
    this.context = context
    const { src } = context
    trace: 'DOC START', JSON.stringify(src.slice(start))
    let offset = this.parseDirectives(start)
    offset = this.parseContents(offset)
    trace: 'DOC', this.contents
    return offset
  }

  toString () {
    const { contents, context: { src }, directives, value } = this
    if (value != null) return value
    let str = directives.join('')
    if (contents.length > 0) {
      if (directives.length > 0 || contents[0].type === Node.Type.COMMENT) str += '---\n'
      str += contents.join('')
    }
    if (str[str.length - 1] !== '\n') str += '\n'
    return str
  }
}
