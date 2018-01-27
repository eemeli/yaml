import Node from './Node'
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

  // a block value should always end with '\n'
  get rawValue () {
    const str = super.rawValue
    return str[str.length - 1] === '\n' ? str : str + '\n'
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
    for (let ch = src[offset]; ch === '\n'; ch = src[offset]) {
      offset += 1
      if (Node.atDocumentBoundary(src, offset)) break
      const end = Node.endOfBlockIndent(src, bi, offset)
      if (end === null) break
      if (!this.blockIndent && src[end] !== '\n') {
        // at first line, without explicit block indent
        this.blockIndent = end - (offset + indent)
        bi = indent + this.blockIndent - 1
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
