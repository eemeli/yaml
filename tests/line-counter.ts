import { LineCounter, parseDocument } from '../index.js'

test('Parse error, no newlines', () => {
  const lineCounter = new LineCounter()
  const doc = parseDocument('foo: bar: baz', { lineCounter })
  expect(doc.errors).toMatchObject([{ offset: 5 }])
  expect(lineCounter.lineStarts).toMatchObject([0])
  expect(lineCounter.linePos(5)).toMatchObject({ line: 1, col: 6 })
})

test('Parse error with newlines', () => {
  const lineCounter = new LineCounter()
  const doc = parseDocument('foo:\n  bar: - baz\n', { lineCounter })
  expect(doc.errors).toMatchObject([{ offset: 14 }])
  expect(lineCounter.lineStarts).toMatchObject([0, 5, 18])
  expect(lineCounter.linePos(14)).toMatchObject({ line: 2, col: 10 })
})

test('block scalar', () => {
  const lineCounter = new LineCounter()
  const doc = parseDocument('foo: |\n a\n b\n c\nbar:\n baz\n', { lineCounter })
  expect(lineCounter.lineStarts).toMatchObject([0, 7, 10, 13, 16, 21, 26])
  for (const { offset, line, col } of [
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
