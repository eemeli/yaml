import Comment from './Comment'
import Directive from './Directive'
import Node, { Char, Type } from './Node'
import Range from './Range'


export default class Document extends Node {
  static startCommentOrEndBlankLine (src, start) {
    const offset = Node.endOfWhiteSpace(src, start)
    const ch = src[offset]
    return ch === '#' || ch === '\n' ? offset : start
  }

  constructor () {
    super(Type.DOCUMENT)
    this.directives = null
    this.contents = null
  }

  parseDirectives (start) {
    const { src } = this.context
    this.directives = []
    let hasDirectives = false
    let offset = start
    while (!Document.atDocumentBoundary(src, offset, Char.DIRECTIVES_END)) {
      offset = Document.startCommentOrEndBlankLine(src, offset)
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
          const directive = new Directive()
          offset = directive.parse({ parent: this, src }, offset)
          this.directives.push(directive)
          hasDirectives = true
          trace: 'directive', { valueRange: directive.valueRange, comment: directive.comment }, JSON.stringify(directive.rawValue)
        } break
        default:
          if (hasDirectives) this.error = new SyntaxError('Missing directives-end indicator line')
          return offset
      }
    }
    if (src[offset]) return offset + 3
    if (hasDirectives) this.error = new SyntaxError('Missing directives-end indicator line')
    return offset
  }

  parseContents (start) {
    const { parseNode, src } = this.context
    this.contents = []
    let lineStart = start
    while (src[lineStart - 1] === '-') lineStart -= 1
    let offset = Node.endOfWhiteSpace(src, start)
    let atLineStart = lineStart === start
    this.valueRange = new Range(offset)
    while (!Document.atDocumentBoundary(src, offset, Char.DOCUMENT_END)) {
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
    if (src[offset]) {
      offset += 3
      if (src[offset]) {
        offset = Node.endOfWhiteSpace(src, offset)
        if (src[offset] === '#') {
          const comment = new Comment()
          offset = comment.parse({ src }, offset)
          this.contents.push(comment)
          trace: 'document-suffix-comment', comment.comment
        }
        switch (src[offset]) {
          case '\n':
            offset += 1
            break
          case undefined:
            break
          default:
            this.error = new SyntaxError('Document end marker line should not have a non-comment suffix')
        }
      }
    }
    return offset
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
    let offset = src.charCodeAt(start) === 0xFEFF ? start + 1 : start  // skip BOM
    offset = this.parseDirectives(offset)
    offset = this.parseContents(offset)
    trace: 'DOC', this.contents
    return offset
  }

  toString () {
    const { contents, context: { src }, directives, value } = this
    if (value != null) return value
    let str = directives.join('')
    if (contents.length > 0) {
      if (directives.length > 0 || contents[0].type === Type.COMMENT) str += '---\n'
      str += contents.join('')
    }
    if (str[str.length - 1] !== '\n') str += '\n'
    return str
  }
}
