import { CST, lex } from 'yaml'

const { DOCUMENT: DOC, SCALAR } = CST

test('unexpected unindent in quoted string with CRLF', () => {
  const src = '- "\r\nx"'
  expect(lex(src)).toEqual([DOC, '-', ' ', '"', '\r\n', SCALAR, 'x"'])
})

test('plain scalar + CRLF + comment', () => {
  const src = 'foo\r\n# bar'
  expect(lex(src)).toEqual([DOC, SCALAR, 'foo', '\r\n', '# bar'])
})

test('Scalar starting with : after flow-ish key in preceding node in flow collection', () => {
  const src = '[[], :@]'
  expect(lex(src)).toEqual([DOC, '[', '[', ']', ',', ' ', SCALAR, ':@', ']'])
})

test('unindented comment in flow collection', () => {
  const src = '- {\n#c\n  }'
  expect(lex(src)).toEqual([DOC, '-', ' ', '{', '\n', '#c', '\n', '  ', '}'])
})

test('indented map + ... + unindented flow collection', () => {
  const src = ' :\n...\n{\n}'
  expect(lex(src)).toEqual([
    DOC,
    ' ',
    ':',
    '\n',
    '...',
    '\n',
    DOC,
    '{',
    '\n',
    '}'
  ])
})

test('multiple empty --- separated documents', () => {
  const src = '---\n---\n---\n---'
  expect(lex(src)).toEqual([DOC, '---', '\n', '---', '\n', '---', '\n', '---'])
})

test('multiple empty ... separated documents', () => {
  const src = '...\n...\n...\n...'
  expect(lex(src)).toEqual([
    DOC,
    '...',
    '\n',
    DOC,
    '...',
    '\n',
    DOC,
    '...',
    '\n',
    DOC,
    '...'
  ])
})

test('trailing comments on ...', () => {
  const src = '... # c\n# d\n... \n'
  expect(lex(src)).toEqual([
    DOC,
    '...',
    ' ',
    '# c',
    '\n',
    '# d',
    '\n',
    DOC,
    '...',
    ' ',
    '\n'
  ])
})

test('standalone CR treated as line break in quoted string (#595)', () => {
  const lfTokens = lex('text: "a\n\n\n\n b"')
  const crTokens = lex('text: "a\r\r\r\r b"')
  expect(crTokens.length).toEqual(lfTokens.length)
})

test('plain scalar + standalone CR + comment', () => {
  const src = 'foo\r# bar'
  expect(lex(src)).toEqual([DOC, SCALAR, 'foo', '\r', '# bar'])
})

test('standalone CR in document', () => {
  const src = 'a: 1\rb: 2'
  expect(lex(src)).toEqual([DOC, SCALAR, 'a', ':', ' ', SCALAR, '1', '\r', SCALAR, 'b', ':', ' ', SCALAR, '2'])
})

test('standalone CR in flow collection', () => {
  const src = '[\r1\r]'
  expect(lex(src)).toEqual([DOC, '[', '\r', SCALAR, '1', '\r', ']'])
})

test('mixed CR and LF line breaks', () => {
  const src = 'a: 1\rb: 2\nc: 3\r\nd: 4'
  const tokens = lex(src)
  expect(tokens).toContain('\r')
  expect(tokens).toContain('\n')
  expect(tokens).toContain('\r\n')
})
