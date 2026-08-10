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

// \r, U+2028 and U+2029 end a line for a /m regexp but not for YAML. Getting
// these wrong makes lex() loop rather than fail, so on a regression these time
// out instead of reporting an assertion error.
test('lone CR at stream start', () => {
  const src = '\rZ\n'
  expect(lex(src)).toEqual([DOC, SCALAR, '\rZ', '\n'])
})

test('Unicode line separators at stream start', () => {
  expect(lex('\u2028Z\n')).toEqual([DOC, SCALAR, '\u2028Z', '\n'])
  expect(lex('\u2029Z\n')).toEqual([DOC, SCALAR, '\u2029Z', '\n'])
})

test('CRLF at stream start', () => {
  const src = '  \r\nA\n'
  expect(lex(src)).toEqual(['  ', '\r\n', DOC, SCALAR, 'A', '\n'])
})

test('comment containing a Unicode line separator', () => {
  const src = '# c\u2028Z\n'
  expect(lex(src)).toEqual(['# c\u2028Z', '\n'])
})

test('comment containing a lone CR', () => {
  expect(lex('# c\rZ\n')).toEqual(['# c\rZ', '\n'])
  expect(lex('#a\r')).toEqual(['#a\r'])
})
