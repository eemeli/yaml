import Node from '../../src/ast/Node'

describe('internals', () => {
  test('constructor', () => {
    const src = 'src'
    const node = new Node(src)
    expect(node.src).toBe(src)
  })

  test('endIndent', () => {
    const src = '  - value\n- other\n'
    const node = new Node(src)
    const in1 = node.endIndent(0)
    expect(in1).toBe(2)
    const offset = src.indexOf('\n') + 1
    const in2 = node.endIndent(offset)
    expect(in2).toBe(offset)
  })

  test('parseComment', () => {
    const src = '#comment here\nnext'
    const node = new Node(src)
    const end = node.parseComment(0)
    expect(node.comment).toBe('comment here')
    expect(end).toBe(src.indexOf('\n'))
  })

  test('parseProps', () => {
    const src = '!tag! &anchor value #comment'
    const node = new Node(src)
    const end = node.parseProps(0)
    expect(node.anchor).toBe('anchor')
    expect(node.tag).toBe('tag!')
    expect(end).toBe(src.indexOf('value'))
  })
})
