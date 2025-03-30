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
