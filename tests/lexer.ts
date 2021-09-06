import { Lexer } from 'yaml'

test('unexpected unindent in quoted string with CRLF', () => {
  const src = '- "\r\nx"'
  let n = 0
  const res: string[] = []
  for (const lex of new Lexer().lex(src)) {
    res.push(lex)
    if (++n === 10) break
  }
  expect(res).toEqual(['\u0002', '-', ' ', '"', '\r\n', '\u001f', 'x"'])
})
