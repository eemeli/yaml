import * as YAML from 'yaml'
import { source } from '../_utils'

test('fail on map value indented with tab', () => {
  const src = 'a:\n\t1\nb:\n\t2\n'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).not.toHaveLength(0)
  expect(() => String(doc)).toThrow(
    'Document with errors cannot be stringified'
  )
})

test('eemeli/yaml#6', () => {
  const src = 'abc: 123\ndef'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toMatchObject([{ pos: [9, 12] }])
})

describe('eemeli/yaml#7', () => {
  test('map', () => {
    const src = '{ , }\n---\n{ 123,,, }\n'
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toMatchObject([{ pos: [2, 3] }])
    expect(docs[1].errors).toMatchObject([{ pos: [16, 17] }, { pos: [17, 18] }])
  })

  test('seq', () => {
    const src = '[ , ]\n---\n[ 123,,, ]\n'
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toMatchObject([{ pos: [2, 3] }])
    expect(docs[1].errors).toMatchObject([{ pos: [16, 17] }, { pos: [17, 18] }])
  })
})

describe('block scalars', () => {
  test('invalid header', () => {
    const doc = YAML.parseDocument('>99\n foo\n')
    expect(doc.errors).toMatchObject(
      [
        'Block scalar header includes extra characters: >99',
        'Unexpected scalar at node end'
      ].map(msg => ({ message: expect.stringContaining(msg) }))
    )
  })
  test('missing newline at header end', () => {
    const doc = YAML.parseDocument('> foo\n')
    expect(doc.errors).toHaveLength(1)
    expect(doc.errors[0].message).toMatch('Not a YAML token: foo')
  })
})

describe('block collections', () => {
  test('mapping with bad indentation', () => {
    const src = 'foo: "1"\n bar: 2\n'
    const doc = YAML.parseDocument(src)
    expect(doc.errors).toHaveLength(1)
    expect(doc.errors[0].message).toMatch(
      'All mapping items must start at the same column'
    )
    expect(doc.contents).toMatchObject({
      items: [
        { key: { value: 'foo' }, value: { value: '1' } },
        { key: { value: 'bar' }, value: { value: 2 } }
      ]
    })
  })

  test('sequence with bad indentation', () => {
    const src = '- "foo"\n - bar\n'
    const doc = YAML.parseDocument(src)
    expect(doc.errors).toHaveLength(1)
    expect(doc.errors[0].message).toMatch(
      'All sequence items must start at the same column'
    )
    expect(doc.contents).toMatchObject({
      items: [{ value: 'foo' }, { items: [{ value: 'bar' }] }]
    })
  })

  test('seq item in mapping', () => {
    const src = 'foo: "1"\n- bar\n'
    const doc = YAML.parseDocument(src)
    expect(doc.errors).toMatchObject(
      [
        'A block sequence may not be used as an implicit map key',
        'Implicit keys need to be on a single line',
        'Implicit map keys need to be followed by map values'
      ].map(msg => ({ message: expect.stringContaining(msg) }))
    )
    expect(doc.contents).toMatchObject({
      items: [
        { key: { value: 'foo' }, value: { value: '1' } },
        { key: { items: [{ value: 'bar' }] }, value: null }
      ]
    })
  })

  test('doubled value indicator', () => {
    const doc = YAML.parseDocument('foo : : bar\n')
    expect(doc.errors).toMatchObject([
      {
        message: source`
          Nested mappings are not allowed in compact mappings at line 1, column 7:

          foo : : bar
                ^
        `
      }
    ])
  })

  test('excessively long key', () => {
    const doc = YAML.parseDocument(`foo ${'x'.repeat(1024)} : bar\n`)
    expect(doc.errors).toMatchObject([
      {
        message: source`
          The : indicator must be at most 1024 chars after the start of an implicit block mapping key at line 1, column 1:

          foo xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx…
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        `
      }
    ])
  })
})

describe('flow collections', () => {
  test('start only of flow map (eemeli/yaml#8)', () => {
    const doc = YAML.parseDocument('{')
    expect(doc.errors).toMatchObject([{ code: 'MISSING_CHAR', pos: [1, 2] }])
  })

  test('start only of flow sequence (eemeli/yaml#8)', () => {
    const doc = YAML.parseDocument('[')
    expect(doc.errors).toMatchObject([{ code: 'MISSING_CHAR', pos: [1, 2] }])
  })

  test('flow sequence without end', () => {
    const doc = YAML.parseDocument('[ foo, bar,')
    expect(doc.errors).toMatchObject([{ code: 'MISSING_CHAR', pos: [11, 12] }])
  })

  test('doc-end within flow sequence', () => {
    const doc = YAML.parseDocument('[ foo, bar,\n...\n]', {
      prettyErrors: false
    })
    expect(doc.errors).toMatchObject([
      { code: 'MISSING_CHAR' },
      { message: 'Unexpected flow-seq-end token in YAML document: "]"' },
      {
        message:
          'Source contains multiple documents; please use YAML.parseAllDocuments()'
      }
    ])
  })

  test('block scalar in flow collection', () => {
    const doc = YAML.parseDocument('{ |\n foo\n}')
    expect(doc.errors).toHaveLength(1)
    expect(doc.errors[0].message).toMatch(
      'Plain value cannot start with block scalar indicator |'
    )
  })

  test('block seq in flow collection', () => {
    const doc = YAML.parseDocument('{\n- foo\n}')
    expect(doc.errors).toMatchObject([{ code: 'BLOCK_IN_FLOW' }])
  })

  test('anchor before explicit key indicator in block map', () => {
    const doc = YAML.parseDocument('&a ? A')
    expect(doc.errors).toMatchObject([{ code: 'BAD_PROP_ORDER' }])
  })

  test('anchor before explicit key indicator in flow map', () => {
    const doc = YAML.parseDocument('{ &a ? A }')
    expect(doc.errors).toMatchObject([{ code: 'BAD_PROP_ORDER' }])
  })

  test('flow map with doubled indicator', () => {
    const doc = YAML.parseDocument('{ foo: : bar }')
    expect(doc.errors).toMatchObject([{ code: 'UNEXPECTED_TOKEN' }])
  })
})

describe('comments', () => {
  test('comment without whitespace after tag', () => {
    const doc = YAML.parseDocument('!<a>#cc\nA')
    expect(doc.errors).toHaveLength(2)
    expect(doc.errors[0].message).toMatch(
      'Tags and anchors must be separated from the next token by white space'
    )
    expect(doc.errors[1].message).toMatch(
      'Comments must be separated from other tokens by white space characters'
    )
  })

  test('comment without whitespace after value', () => {
    const doc = YAML.parseDocument('foo: "bar"#cc')
    expect(doc.errors).toHaveLength(1)
    expect(doc.errors[0].message).toMatch(
      'Comments must be separated from other tokens by white space characters'
    )
  })
})

describe('pretty errors', () => {
  test('eemeli/yaml#6', () => {
    const src = 'abc: 123\ndef'
    const doc = YAML.parseDocument(src, { prettyErrors: true })
    expect(doc.errors).toMatchObject([
      {
        message: source`
          Implicit map keys need to be followed by map values at line 2, column 1:

          abc: 123
          def
          ^^^
        `,
        pos: [9, 12],
        linePos: [
          { line: 2, col: 1 },
          { line: 2, col: 4 }
        ]
      }
    ])
    expect(doc.errors[0]).not.toHaveProperty('source')
  })

  test('eemeli/yaml#7 maps', () => {
    const src = '{ , }\n---\n{ 123,,, }\n'
    const docs = YAML.parseAllDocuments(src, { prettyErrors: true })
    expect(docs[0].errors).toMatchObject([
      {
        message: source`
          Unexpected , in flow map at line 1, column 3:

          { , }
            ^
        `,
        pos: [2, 3],
        linePos: [
          { line: 1, col: 3 },
          { line: 1, col: 4 }
        ]
      }
    ])
    expect(docs[0].errors[0]).not.toHaveProperty('source')
    expect(docs[1].errors).toMatchObject([
      {
        code: 'UNEXPECTED_TOKEN',
        message: source`
          Unexpected , in flow map at line 3, column 7:

          { 123,,, }
                ^
        `,
        pos: [16, 17],
        linePos: [
          { line: 3, col: 7 },
          { line: 3, col: 8 }
        ]
      },
      {
        code: 'UNEXPECTED_TOKEN',
        message: source`
          Unexpected , in flow map at line 3, column 8:

          { 123,,, }
                 ^
        `,
        pos: [17, 18],
        linePos: [
          { line: 3, col: 8 },
          { line: 3, col: 9 }
        ]
      }
    ])
    expect(docs[1].errors[0]).not.toHaveProperty('source')
    expect(docs[1].errors[1]).not.toHaveProperty('source')
  })

  test('pretty warnings', () => {
    const src = '%FOO\n---bar\n'
    const doc = YAML.parseDocument(src, { prettyErrors: true })
    expect(doc.warnings).toMatchObject([{ name: 'YAMLWarning' }])
  })
})

describe('tags on invalid nodes', () => {
  test('!!map on scalar', () => {
    const doc = YAML.parseDocument('!!map foo')
    expect(doc.warnings).toHaveLength(1)
    expect(doc.warnings[0].message).toMatch(
      'Unresolved tag: tag:yaml.org,2002:map'
    )
    expect(doc.toJS()).toBe('foo')
  })

  test('!!str on map', () => {
    const doc = YAML.parseDocument('!!str { answer: 42 }')
    expect(doc.warnings).toHaveLength(1)
    expect(doc.warnings[0].message).toMatch(
      'Unresolved tag: tag:yaml.org,2002:str'
    )
    expect(doc.toJS()).toMatchObject({ answer: 42 })
  })
})

describe('invalid options', () => {
  test('unknown schema', () => {
    expect(() => new YAML.Document(undefined, { schema: 'foo' })).toThrow(
      /Unknown schema/
    )
  })

  test('unknown custom tag', () => {
    expect(() => new YAML.Document(undefined, { customTags: ['foo'] })).toThrow(
      /Unknown custom tag/
    )
  })
})

test('broken document with comment before first node', () => {
  const doc = YAML.parseDocument('#c\n*x\nfoo\n', { prettyErrors: false })
  expect(doc.errors).toMatchObject([
    { message: 'Unexpected scalar at node end' }
  ])
})

test('multiple tags on one node', () => {
  const doc = YAML.parseDocument('!foo !bar baz\n')
  expect(doc.contents).toMatchObject({ value: 'baz', type: 'PLAIN' })
  expect(doc.errors).toHaveLength(1)
  expect(doc.warnings).toHaveLength(1)
})

describe('logLevel', () => {
  // process.emitWarning will throw in Jest if `warning` is an Error instance
  // due to https://github.com/facebook/jest/issues/2549

  const mock = jest.spyOn(global.process, 'emitWarning').mockImplementation()
  beforeEach(() => mock.mockClear())
  afterEach(() => mock.mockRestore())

  test('by default, warn for tag fallback', () => {
    YAML.parse('!foo bar')
    const message = source`
      Unresolved tag: !foo at line 1, column 1:

      !foo bar
      ^^^^
    `
    expect(mock.mock.calls).toMatchObject([[{ message }]])
  })

  test("silence warnings with logLevel: 'error'", () => {
    YAML.parse('!foo bar', { logLevel: 'error' })
    expect(mock).toHaveBeenCalledTimes(0)
  })

  test("silence warnings with logLevel: 'silent'", () => {
    YAML.parse('!foo bar', { logLevel: 'silent' })
    expect(mock).toHaveBeenCalledTimes(0)
  })

  test("silence errors with logLevel: 'silent'", () => {
    const res = YAML.parse('foo: bar: baz\n---\ndoc2\n', { logLevel: 'silent' })
    expect(res).toMatchObject({ foo: { bar: 'baz' } })
  })
})

describe('Invalid plain first characters', () => {
  for (const ch of [',', '%', '@', '`'])
    test(ch, () => {
      const doc = YAML.parseDocument(`- ${ch}foo`)
      expect(doc.errors).toMatchObject([{ code: 'BAD_SCALAR_START' }])
    })
})
