import { CST, Lexer } from 'yaml'

const { DOCUMENT: DOC, SCALAR } = CST

test('unexpected unindent in quoted string with CRLF', () => {
  const src = '- "\r\nx"'
  let n = 0
  const res: string[] = []
  for (const lex of new Lexer().lex(src)) {
    res.push(lex)
    if (++n === 10) break
  }
  expect(res).toEqual([DOC, '-', ' ', '"', '\r\n', SCALAR, 'x"'])
})

test('plain scalar + CRLF + comment', () => {
  const src = 'foo\r\n# bar'
  const res = Array.from(new Lexer().lex(src))
  expect(res).toEqual([DOC, SCALAR, 'foo', '\r\n', '# bar'])
})

test('Scalar starting with : after flow-ish key in preceding node in flow collection', () => {
  const src = '[[], :@]'
  const res = Array.from(new Lexer().lex(src))
  expect(res).toEqual([DOC, '[', '[', ']', ',', ' ', SCALAR, ':@', ']'])
})

test('unindented comment in flow collection', () => {
  const src = '- {\n#c\n  }'
  const res = Array.from(new Lexer().lex(src))
  expect(res).toEqual([DOC, '-', ' ', '{', '\n', '#c', '\n', '  ', '}'])
})

test('indented map + ... + unindented flow collection', () => {
  const src = ' :\n...\n{\n}'
  const res = Array.from(new Lexer().lex(src))
  expect(res).toEqual([DOC, ' ', ':', '\n', '...', '\n', DOC, '{', '\n', '}'])
})
