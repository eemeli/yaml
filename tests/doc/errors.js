import { YAMLError } from '../../src/errors.js'
import * as YAML from '../../src/index.js'

test('require a message and source for all errors', () => {
  const exp = /Invalid arguments/
  expect(() => new YAMLError()).toThrow(exp)
  expect(() => new YAMLError('Foo')).toThrow(exp)
  expect(() => new YAMLError('Foo', {})).toThrow(exp)
})

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
  expect(doc.errors).toMatchObject([{ name: 'YAMLParseError', offset: 9 }])
})

describe.skip('eemeli/yaml#7', () => {
  test('map', () => {
    const src = '{ , }\n---\n{ 123,,, }\n'
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toMatchObject([
      { name: 'YAMLParseError', offset: 2 }
    ])
    expect(docs[1].errors).toMatchObject([
      { name: 'YAMLParseError', offset: 16 },
      { name: 'YAMLParseError', offset: 17 }
    ])
    // const node = docs[0].errors[0].source
    // expect(node).toBeInstanceOf(Node)
    // expect(node.rangeAsLinePos).toMatchObject({
    //   start: { line: 1, col: 1 },
    //   end: { line: 1, col: 6 }
    // })
  })
  test('seq', () => {
    const src = '[ , ]\n---\n[ 123,,, ]\n'
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toMatchObject([
      { name: 'YAMLParseError', offset: 2 }
    ])
    expect(docs[1].errors).toMatchObject([
      { name: 'YAMLParseError', offset: 16 },
      { name: 'YAMLParseError', offset: 17 }
    ])
    // const node = docs[1].errors[0].source
    // expect(node).toBeInstanceOf(Node)
    // expect(node.rangeAsLinePos).toMatchObject({
    //   start: { line: 3, col: 1 },
    //   end: { line: 3, col: 11 }
    // })
  })
})

describe('block scalars', () => {
  test('invalid header', () => {
    const doc = YAML.parseDocument('>99\n foo\n')
    expect(doc.errors).toMatchObject([
      { message: 'Block scalar header includes extra characters: >99' },
      { message: 'Unexpected scalar at node end' }
    ])
  })
  test('missing newline at header end', () => {
    const doc = YAML.parseDocument('> foo\n')
    expect(doc.errors).toMatchObject([{ message: 'Not a YAML token: foo' }])
  })
})

describe('block collections', () => {
  test('mapping with bad indentation', () => {
    const src = 'foo: "1"\n bar: 2\n'
    const doc = YAML.parseDocument(src)
    expect(doc.errors).toMatchObject([
      { message: 'All mapping items must start at the same column' }
    ])
    expect(doc.contents).toMatchObject({
      type: 'MAP',
      items: [
        { key: { value: 'foo' }, value: { value: '1' } },
        { key: { value: 'bar' }, value: { value: 2 } }
      ]
    })
  })

  test('sequence with bad indentation', () => {
    const src = '- "foo"\n - bar\n'
    const doc = YAML.parseDocument(src)
    expect(doc.errors).toMatchObject([
      { message: 'All sequence items must start at the same column' }
    ])
    expect(doc.contents).toMatchObject({
      type: 'SEQ',
      items: [{ value: 'foo' }, { items: [{ value: 'bar' }] }]
    })
  })

  test('seq item in mapping', () => {
    const src = 'foo: "1"\n- bar\n'
    const doc = YAML.parseDocument(src)
    expect(doc.errors).toMatchObject([
      { message: 'A block sequence may not be used as an implicit map key' },
      { message: 'Implicit keys need to be on a single line' },
      { message: 'Implicit map keys need to be followed by map values' }
    ])
    expect(doc.contents).toMatchObject({
      type: 'MAP',
      items: [
        { key: { value: 'foo' }, value: { value: '1' } },
        { key: { items: [{ value: 'bar' }] }, value: null }
      ]
    })
  })

  test('doubled value indicator', () => {
    const doc = YAML.parseDocument('foo : : bar\n')
    expect(doc.errors).toMatchObject([
      { message: 'Nested mappings are not allowed in compact mappings' }
    ])
  })

  test('excessively long key', () => {
    const doc = YAML.parseDocument(`foo ${'x'.repeat(1024)} : bar\n`)
    expect(doc.errors).toMatchObject([
      {
        message:
          'The : indicator must be at most 1024 chars after the start of an implicit block mapping key'
      }
    ])
  })
})

describe('flow collections', () => {
  test('start only of flow map (eemeli/yaml#8)', () => {
    const doc = YAML.parseDocument('{')
    expect(doc.errors).toMatchObject([
      {
        name: 'YAMLParseError',
        message: 'Expected flow map to end with }',
        offset: 1
      }
    ])
  })

  test('start only of flow sequence (eemeli/yaml#8)', () => {
    const doc = YAML.parseDocument('[')
    expect(doc.errors).toMatchObject([
      {
        name: 'YAMLParseError',
        message: 'Expected flow sequence to end with ]',
        offset: 1
      }
    ])
  })

  test('flow sequence without end', () => {
    const doc = YAML.parseDocument('[ foo, bar,')
    expect(doc.errors).toMatchObject([
      {
        name: 'YAMLParseError',
        message: 'Expected flow sequence to end with ]',
        offset: 11
      }
    ])
  })

  test('doc-end within flow sequence', () => {
    const doc = YAML.parseDocument('[ foo, bar,\n...\n]')
    expect(doc.errors).toMatchObject([
      { message: 'Expected flow sequence to end with ]' },
      { message: 'Unexpected flow-seq-end token in YAML document: "]"' },
      {
        message:
          'Source contains multiple documents; please use YAML.parseAllDocuments()'
      }
    ])
  })

  test('block scalar in flow collection', () => {
    const doc = YAML.parseDocument('{ |\n foo\n}')
    expect(doc.errors).toMatchObject([
      { message: 'Plain value cannot start with block scalar indicator |' }
    ])
  })

  test('block seq in flow collection', () => {
    const doc = YAML.parseDocument('{\n- foo\n}')
    expect(doc.errors).toMatchObject([
      { message: 'Block collections are not allowed within flow collections' }
    ])
  })

  test('anchor before explicit key indicator', () => {
    const doc = YAML.parseDocument('{ &a ? A }')
    expect(doc.errors).toMatchObject([
      { message: 'Anchors and tags must be after the ? indicator' }
    ])
  })
})

describe('comments', () => {
  test('comment without whitespace after tag', () => {
    const doc = YAML.parseDocument('!<a>#cc\nA')
    expect(doc.errors).toMatchObject([
      {
        message:
          'Comments must be separated from other tokens by white space characters'
      }
    ])
  })

  test('comment without whitespace after value', () => {
    const doc = YAML.parseDocument('foo: "bar"#cc')
    expect(doc.errors).toMatchObject([
      {
        message:
          'Comments must be separated from other tokens by white space characters'
      }
    ])
  })
})

describe.skip('pretty errors', () => {
  test('eemeli/yaml#6', () => {
    const src = 'abc: 123\ndef'
    const doc = YAML.parseDocument(src, { prettyErrors: true })
    expect(doc.errors).toMatchObject([
      {
        name: 'YAMLParseError',
        message:
          'Implicit map keys need to be followed by map values at line 2, column 1:\n\ndef\n^^^\n',
        offset: 9,
        linePos: { start: { line: 2, col: 1 }, end: { line: 2, col: 4 } }
      }
    ])
    expect(doc.errors[0]).not.toHaveProperty('source')
  })

  test('eemeli/yaml#7 maps', () => {
    const src = '{ , }\n---\n{ 123,,, }\n'
    const docs = YAML.parseAllDocuments(src, { prettyErrors: true })
    expect(docs[0].errors).toMatchObject([
      {
        name: 'YAMLParseError',
        message: 'Unexpected , in flow map',
        offset: 2,
        linePos: { start: { line: 1, col: 3 }, end: { line: 1, col: 4 } }
      }
    ])
    expect(docs[0].errors[0]).not.toHaveProperty('source')
    expect(docs[1].errors).toMatchObject([
      {
        name: 'YAMLParseError',
        message: 'Unexpected , in flow map',
        offset: 16,
        linePos: { start: { line: 3, col: 7 }, end: { line: 3, col: 8 } }
      },
      {
        name: 'YAMLParseError',
        message: 'Unexpected , in flow map',
        offset: 17,
        linePos: { start: { line: 3, col: 8 }, end: { line: 3, col: 9 } }
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

describe('invalid options', () => {
  test('unknown schema', () => {
    const doc = new YAML.Document(undefined, { schema: 'foo' })
    expect(() => doc.setSchema()).toThrow(/Unknown schema/)
  })

  test('unknown custom tag', () => {
    const doc = new YAML.Document(undefined, { customTags: ['foo'] })
    expect(() => doc.setSchema()).toThrow(/Unknown custom tag/)
  })
})

test('broken document with comment before first node', () => {
  const doc = YAML.parseDocument('#c\n*x\nfoo\n')
  expect(doc.errors).toMatchObject([
    { name: 'YAMLParseError', message: 'Aliased anchor not found: x' },
    { name: 'YAMLParseError', message: 'Unexpected scalar at node end' }
  ])
})

describe('broken directives', () => {
  for (const tag of ['%TAG', '%YAML'])
    test(`incomplete ${tag} directive`, () => {
      const doc = YAML.parseDocument(`${tag}\n---\n`)
      expect(doc.errors).toMatchObject([{ name: 'YAMLParseError', offset: 0 }])
    })

  test('missing separator', () => {
    const doc = YAML.parseDocument(`%YAML 1.2\n`)
    expect(doc.errors).toMatchObject([{ name: 'YAMLParseError', offset: 10 }])
  })
})

test('multiple tags on one node', () => {
  const doc = YAML.parseDocument('!foo !bar baz\n')
  expect(doc.contents).toMatchObject({ value: 'baz', type: 'PLAIN' })
  expect(doc.errors).toMatchObject([{ name: 'YAMLParseError' }])
  expect(doc.warnings).toMatchObject([{}])
})

describe('logLevel', () => {
  // process.emitWarning will throw in Jest if `warning` is an Error instance
  // due to https://github.com/facebook/jest/issues/2549

  const mock = jest.spyOn(global.process, 'emitWarning').mockImplementation()
  beforeEach(() => mock.mockClear())
  afterEach(() => mock.mockRestore())

  test('by default, warn for tag fallback', () => {
    YAML.parse('!foo bar')
    const message = 'Unresolved tag: !foo'
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
