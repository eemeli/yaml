import Node from '../../src/ast/Node'

describe('internals', () => {
  test('constructor', () => {
    const src = 'src'
    const props = { anchor: 'anchor', tag: 'tag', type: Node.Type.PLAIN }
    const node = new Node({ src }, props)
    expect(node.doc.src).toBe(src)
    expect(node.anchor).toBe(props.anchor)
    expect(node.tag).toBe(props.tag)
    expect(node.type).toBe(props.type)
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
    const node = new Node({ src }, {})
    const end = node.parseComment(0)
    expect(node.comment).toBe('comment here')
    expect(end).toBe(src.indexOf('\n'))
  })

  test('.parseProps', () => {
    const src = '!tag! &anchor *value #comment'
    const props = Node.parseProps(src, 0)
    expect(props).toMatchObject({
      anchor: 'anchor',
      tag: 'tag!',
      type: Node.Type.ALIAS,
      valueStart: src.indexOf('*')
    })
  })
})
