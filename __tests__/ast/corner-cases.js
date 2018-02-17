import Node, { Type } from '../../src/ast/Node'
import parse from '../../src/ast/index'
import { pretty } from './common'

test('folded block with chomp: keep', () => {
  const src = `>+\nblock\n\n`
  const doc = parse(src)[0]
  expect(doc.contents[0].strValue).toBe('block\n\n')
})

test('multiple linebreaks in plain scalar', () => {
  const src = `trimmed\n\n\n\nlines\n`
  const doc = parse(src)[0]
  expect(doc.contents[0].strValue).toBe('trimmed\n\n\nlines')
})
