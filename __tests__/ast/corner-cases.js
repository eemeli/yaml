import Node, { Type } from '../../src/ast/Node'
import parse from '../../src/ast/parse'
import { pretty } from './common'

describe('folded block with chomp: keep', () => {
  test('nl + nl', () => {
    const src = `>+\nblock\n\n`
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('block\n\n')
  })

  test('nl + nl + sp + nl', () => {
    const src = ">+\nab\n\n \n"
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('ab\n\n \n')
  })
})

describe('multiple linebreaks in scalars', () => {
  test('plain', () => {
    const src = `trimmed\n\n\n\nlines\n`
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('trimmed\n\n\nlines')
  })

  test('single-quoted', () => {
    const src = `'trimmed\n\n\n\nlines'\n`
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('trimmed\n\n\nlines')
  })
})

test('no null document for document-end marker', () => {
  const src = '---\nx\n...\n'
  const docs = parse(src)
  expect(docs).toHaveLength(1)
})

test('explicit key after empty value', () => {
  const src = 'one:\n? two\n'
  const doc = parse(src)[0]
  const raw = doc.contents[0].items.map(it => it.rawValue)
  expect(raw).toMatchObject([
    'one', ':',
    '? two'
  ])
})

test('seq with anchor as explicit key', () => {
  const src = '? &key\n- a\n'
  const doc = parse(src)[0]
  expect(doc.contents).toHaveLength(1)
  expect(doc.contents[0].items[0].node.rawValue).toBe('- a')
})

test('unindented single-quoted string', () => {
  const src = `key: 'two\nlines'\n`
  const doc = parse(src)[0]
  const { node } = doc.contents[0].items[1]
  expect(node.error).toBeNull()
  expect(node.strValue).toMatchObject({
    str: 'two lines',
    errors: [new SyntaxError('Multi-line single-quoted string needs to be sufficiently indented')]
  })
})
