import { LineCounter, parseDocument } from 'yaml'

test('Parse error, no newlines', () => {
  const lineCounter = new LineCounter()
  const doc = parseDocument('foo: bar: baz', { lineCounter })
  expect(doc.errors).toMatchObject([{ pos: [5, 6] }])
  expect(lineCounter.lineStarts).toMatchObject([0])
  expect(lineCounter.linePos(5)).toMatchObject({ line: 1, col: 6 })
})

test('Parse error with newlines', () => {
  const lineCounter = new LineCounter()
  const doc = parseDocument('foo:\n  bar: - baz\n', { lineCounter })
  expect(doc.errors).toMatchObject([{ pos: [14, 17] }])
  expect(lineCounter.lineStarts).toMatchObject([0, 5, 18])
  expect(lineCounter.linePos(14)).toMatchObject({ line: 2, col: 10 })
  expect(lineCounter.linePos(17)).toMatchObject({ line: 2, col: 13 })
})

test('block scalar', () => {
  const lineCounter = new LineCounter()
  parseDocument('foo: |\n a\n b\n c\nbar:\n baz\n', { lineCounter })
  expect(lineCounter.lineStarts).toMatchObject([0, 7, 10, 13, 16, 21, 26])
  for (const { offset, line, col } of [
    { offset: 0, line: 1, col: 1 },
    { offset: 10, line: 3, col: 1 },
    { offset: 11, line: 3, col: 2 },
    { offset: 12, line: 3, col: 3 },
    { offset: 13, line: 4, col: 1 },
    { offset: 14, line: 4, col: 2 },
    { offset: 15, line: 4, col: 3 },
    { offset: 16, line: 5, col: 1 },
    { offset: 17, line: 5, col: 2 },
    { offset: 18, line: 5, col: 3 }
  ]) {
    expect(lineCounter.linePos(offset)).toMatchObject({ line, col })
  }
})

test('flow scalar', () => {
  const lineCounter = new LineCounter()
  const doc = parseDocument(`?\n "a\n b"\n: '\n c\n \n\n d'\n`, {
    lineCounter
  })
  expect(doc.toJS()).toMatchObject({ 'a b': ' c\n\nd' })
  expect(lineCounter.lineStarts).toMatchObject([
    0, 2, 6, 10, 14, 17, 19, 20, 24
  ])
})
