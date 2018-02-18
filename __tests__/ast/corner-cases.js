import Node, { Type } from '../../src/ast/Node'
import parse from '../../src/ast/index'
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

test('multiple linebreaks in plain scalar', () => {
  const src = `trimmed\n\n\n\nlines\n`
  const doc = parse(src)[0]
  expect(doc.contents[0].strValue).toBe('trimmed\n\n\nlines')
})

test('no null document for document-end marker', () => {
  const src = '---\nx\n...\n'
  const stream = parse(src)
  expect(stream).toHaveLength(1)
})
