import Node, { Type } from '../../src/ast/Node'
import Range from '../../src/ast/Range'

describe('internals', () => {
  test('constructor', () => {
    const src = '&anchor !tag src'
    const props = [new Range(0, 7), new Range(8, 12)]
    const node = new Node(Type.PLAIN, props, { src })
    expect(node.context.src).toBe(src)
    expect(node.anchor).toBe('anchor')
    expect(node.tag).toBe('tag')
    expect(node.type).toBe(Type.PLAIN)
  })

  test('.endOfIndent', () => {
    const src = '  - value\n- other\n'
    const in1 = Node.endOfIndent(src, 0)
    expect(in1).toBe(2)
    const offset = src.indexOf('\n') + 1
    const in2 = Node.endOfIndent(src, offset)
    expect(in2).toBe(offset)
  })

  test('#parseComment', () => {
    const src = '#comment here\nnext'
    const node = new Node(Type.COMMENT, null, { src })
    const end = node.parseComment(0)
    expect(node.comment).toBe('comment here')
    expect(end).toBe(src.indexOf('\n'))
  })
})
