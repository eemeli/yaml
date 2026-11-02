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

describe('no infinite loop on lone CR, U+2028 or U+2029', () => {
  for (const [name, ch] of [
    ['CR', '\r'],
    ['LS', '\u2028'],
    ['PS', '\u2029']
  ]) {
    test(`${name} as only character`, () => {
      expect(lex(ch)).toEqual([DOC, SCALAR, ch])
    })

    test(`${name} in comment at stream start`, () => {
      const src = `# a${ch}b\nc`
      expect(lex(src)).toEqual([`# a${ch}b`, '\n', DOC, SCALAR, 'c'])
    })

    test(`${name} in comment after directive`, () => {
      const src = `%YAML 1.2 # a${ch}b\n---\n`
      expect(lex(src)).toEqual([
        '%YAML 1.2',
        ' ',
        `# a${ch}b`,
        '\n',
        DOC,
        '---',
        '\n'
      ])
    })

    test(`${name} in comment after document marker`, () => {
      const src = `--- # a${ch}b\nc`
      expect(lex(src)).toEqual([
        DOC,
        '---',
        ' ',
        `# a${ch}b`,
        '\n',
        SCALAR,
        'c'
      ])
    })

    test(`${name} in comment after document end marker`, () => {
      const src = `... # a${ch}b\n${ch}`
      expect(lex(src)).toEqual([
        DOC,
        '...',
        ' ',
        `# a${ch}b`,
        '\n',
        DOC,
        SCALAR,
        ch
      ])
    })
  }
})
