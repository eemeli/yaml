import Node, { Type } from './Node'
import Range from './Range'

export const Chomp = {
  CLIP: 'CLIP',
  KEEP: 'KEEP',
  STRIP: 'STRIP'
}

export default class BlockValue extends Node {
  constructor (type, props) {
    super(type, props)
    this.blockIndent = null
    this.chomping = Chomp.CLIP
  }

  get strValue () {
    if (!this.valueRange || !this.context) return null
    let { start, end } = this.valueRange
    const { indent, src } = this.context
    if (this.valueRange.isEmpty) return ''
    let lastNewLine = null
    let ch = src[end - 1]
    while (ch === '\n' || ch === '\t' || ch === ' ') {
      end -= 1
      if (end <= start) {
        if (this.chomping === Chomp.KEEP) break
        else return ''
      }
      if (ch === '\n') lastNewLine = end
      ch = src[end - 1]
    }
    let keepStart = end + 1
    if (lastNewLine) {
      if (this.chomping === Chomp.KEEP) {
        keepStart = lastNewLine
        end = this.valueRange.end
      } else {
        end = lastNewLine
      }
    }
    const bi = indent + this.blockIndent
    const folded = (this.type === Type.BLOCK_FOLDED)
    let str = ''
    let sep = ''
    let prevMoreIndented = false
    for (let i = start; i < end; ++i) {
      for (let j = 0; j < bi; ++j) {
        if (src[i] !== ' ') break
        i += 1
      }
      let ch = src[i]
      if (ch === '\n') {
        if (sep === '\n') str += '\n'
        else sep = '\n'
      } else {
        const lineEnd = Node.endOfLine(src, i)
        let line = src.slice(i, lineEnd)
        i = lineEnd
        if (folded && (ch === ' ' || ch === '\t') && i < keepStart) {
          if (sep === ' ') sep = '\n'
          else if (!prevMoreIndented && sep === '\n') sep = '\n\n'
          str += sep + line //+ ((lineEnd < end && src[lineEnd]) || '')
          sep = (lineEnd < end && src[lineEnd]) || ''
          prevMoreIndented = true
        } else {
          str += sep + line
          sep = folded && i < keepStart ? ' ' : '\n'
          prevMoreIndented = false
        }
      }
    }
    return this.chomping === Chomp.STRIP ? str : str + '\n'
  }

  parseBlockHeader (start) {
    const { src } = this.context
    let offset = start + 1
    let bi = ''
    while (true) {
      let ch = src[offset]
      switch (ch) {
        case '-':
          this.chomping = Chomp.STRIP
          break
        case '+':
          this.chomping = Chomp.KEEP
          break
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          bi += ch
          break
        default:
          this.blockIndent = Number(bi) || null
          return offset
      }
      offset += 1
    }
  }

  parseBlockValue (start) {
    const { indent, inFlow, src } = this.context
    let offset = start
    let bi = this.blockIndent ? indent + this.blockIndent - 1 : indent
    let minBlockIndent = 1
    for (let ch = src[offset]; ch === '\n'; ch = src[offset]) {
      offset += 1
      if (Node.atDocumentBoundary(src, offset)) break
      const end = Node.endOfBlockIndent(src, bi, offset) // should not include tab?
      if (end === null) break
      if (!this.blockIndent) {
        // no explicit block indent, none yet detected
        const lineIndent = end - (offset + indent)
        if (src[end] !== '\n') {
          // first line with non-whitespace content
          if (lineIndent < minBlockIndent) {
            offset -= 1
            break
          }
          this.blockIndent = lineIndent
          bi = indent + this.blockIndent - 1
        } else if (lineIndent > minBlockIndent) {
          // empty line with more whitespace
          minBlockIndent = lineIndent
        }
      }
      offset = Node.endOfLine(src, end)
    }
    this.valueRange = new Range(start + 1, offset)
    return offset
  }

  /**
   * Parses a block value from the source
   *
   * Accepted forms are:
   * ```
   * BS
   * block
   * lines
   *
   * BS #comment
   * block
   * lines
   * ```
   * where the block style BS matches the regexp `[|>][-+1-9]*` and block lines
   * are empty or have an indent level greater than `indent`.
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this block
   */
  parse (context, start) {
    this.context = context
    trace: 'block-start', context.pretty, { start }
    const { src } = context
    let offset = this.parseBlockHeader(start)
    offset = Node.endOfWhiteSpace(src, offset)
    offset = this.parseComment(offset)
    offset = this.parseBlockValue(offset)
    trace: this.type, { style: this.blockStyle, valueRange: this.valueRange, comment: this.comment }, JSON.stringify(this.rawValue)
    return offset
  }
}
