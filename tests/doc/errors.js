import Node from '../../src/cst/Node'
import { YAMLError } from '../../src/errors'
import { warnFileDeprecation, warnOptionDeprecation } from '../../src/warnings'
import YAML from '../../src/index'

test('require a message and source for all errors', () => {
  const exp = /Invalid arguments/
  expect(() => new YAMLError()).toThrow(exp)
  expect(() => new YAMLError('Foo')).toThrow(exp)
  expect(() => new YAMLError('Foo', {})).toThrow(exp)
  expect(() => new YAMLError('Foo', new Node())).toThrow(exp)
  expect(() => new YAMLError('Foo', null, 'foo')).toThrow(exp)
  expect(() => new YAMLError('Foo', new Node(), 'foo')).not.toThrow()
})

test('fail on map value indented with tab', () => {
  const src = 'a:\n\t1\nb:\n\t2\n'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toMatchObject([
    { name: 'YAMLSemanticError' },
    { name: 'YAMLSemanticError' }
  ])
  expect(() => String(doc)).toThrow(
    'Document with errors cannot be stringified'
  )
})

test('eemeli/yaml#6', () => {
  const src = 'abc: 123\ndef'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toMatchObject([{ name: 'YAMLSemanticError' }])
  const node = doc.errors[0].source
  expect(node).toBeInstanceOf(Node)
  expect(node.rangeAsLinePos).toMatchObject({
    start: { line: 2, col: 1 },
    end: { line: 2, col: 4 }
  })
})

describe('eemeli/yaml#7', () => {
  test('map', () => {
    const src = '{ , }\n---\n{ 123,,, }\n'
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toMatchObject([{ name: 'YAMLSyntaxError' }])
    expect(docs[1].errors).toMatchObject([
      { name: 'YAMLSyntaxError' },
      { name: 'YAMLSyntaxError' }
    ])
    const node = docs[0].errors[0].source
    expect(node).toBeInstanceOf(Node)
    expect(node.rangeAsLinePos).toMatchObject({
      start: { line: 1, col: 1 },
      end: { line: 1, col: 6 }
    })
  })
  test('seq', () => {
    const src = '[ , ]\n---\n[ 123,,, ]\n'
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toMatchObject([{ name: 'YAMLSyntaxError' }])
    expect(docs[1].errors).toMatchObject([
      { name: 'YAMLSyntaxError' },
      { name: 'YAMLSyntaxError' }
    ])
    const node = docs[1].errors[0].source
    expect(node).toBeInstanceOf(Node)
    expect(node.rangeAsLinePos).toMatchObject({
      start: { line: 3, col: 1 },
      end: { line: 3, col: 11 }
    })
  })
})

describe('missing flow collection terminator', () => {
  test('start only of flow map (eemeli/yaml#8)', () => {
    const doc = YAML.parseDocument('{', { prettyErrors: true })
    expect(doc.errors).toMatchObject([
      {
        name: 'YAMLSemanticError',
        message:
          'Expected flow map to end with } at line 1, column 2:\n\n{\n ^\n',
        nodeType: 'FLOW_MAP',
        range: { start: 1, end: 2 },
        linePos: { start: { line: 1, col: 2 }, end: { line: 1, col: 3 } }
      }
    ])
  })

  test('start only of flow sequence (eemeli/yaml#8)', () => {
    const doc = YAML.parseDocument('[', { prettyErrors: true })
    expect(doc.errors).toMatchObject([
      {
        name: 'YAMLSemanticError',
        message:
          'Expected flow sequence to end with ] at line 1, column 2:\n\n[\n ^\n',
        nodeType: 'FLOW_SEQ',
        range: { start: 1, end: 2 },
        linePos: { start: { line: 1, col: 2 }, end: { line: 1, col: 3 } }
      }
    ])
  })

  test('flow sequence without end', () => {
    const doc = YAML.parseDocument('[ foo, bar,', { prettyErrors: true })
    expect(doc.errors).toMatchObject([
      {
        name: 'YAMLSemanticError',
        message:
          'Expected flow sequence to end with ] at line 1, column 12:\n\n[ foo, bar,\n           ^\n',
        nodeType: 'FLOW_SEQ',
        range: { start: 11, end: 12 },
        linePos: { start: { line: 1, col: 12 }, end: { line: 1, col: 13 } }
      }
    ])
  })
})

describe('pretty errors', () => {
  test('eemeli/yaml#6', () => {
    const src = 'abc: 123\ndef'
    const doc = YAML.parseDocument(src, { prettyErrors: true })
    expect(doc.errors).toMatchObject([
      {
        name: 'YAMLSemanticError',
        message:
          'Implicit map keys need to be followed by map values at line 2, column 1:\n\ndef\n^^^\n',
        nodeType: 'PLAIN',
        range: { start: 9, end: 12 },
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
        name: 'YAMLSyntaxError',
        message:
          'Flow map contains an unexpected , at line 1, column 3:\n\n{ , }\n  ^\n',
        nodeType: 'FLOW_MAP',
        range: { start: 2, end: 3 },
        linePos: { start: { line: 1, col: 3 }, end: { line: 1, col: 4 } }
      }
    ])
    expect(docs[0].errors[0]).not.toHaveProperty('source')
    expect(docs[1].errors).toMatchObject([
      {
        name: 'YAMLSyntaxError',
        message:
          'Flow map contains an unexpected , at line 3, column 7:\n\n{ 123,,, }\n      ^\n',
        nodeType: 'FLOW_MAP',
        range: { start: 16, end: 17 },
        linePos: { start: { line: 3, col: 7 }, end: { line: 3, col: 8 } }
      },
      {
        name: 'YAMLSyntaxError',
        message:
          'Flow map contains an unexpected , at line 3, column 8:\n\n{ 123,,, }\n       ^\n',
        nodeType: 'FLOW_MAP',
        range: { start: 17, end: 18 },
        linePos: { start: { line: 3, col: 8 }, end: { line: 3, col: 9 } }
      }
    ])
    expect(docs[1].errors[0]).not.toHaveProperty('source')
    expect(docs[1].errors[1]).not.toHaveProperty('source')
  })

  test('pretty warnings', () => {
    const src = '%FOO\n---bar\n'
    const doc = YAML.parseDocument(src, { prettyErrors: true })
    expect(doc.warnings).toMatchObject([
      { name: 'YAMLWarning', nodeType: 'DIRECTIVE' }
    ])
  })
})

describe('invalid options', () => {
  test('unknown schema', () => {
    const doc = new YAML.Document({ schema: 'foo' })
    expect(() => doc.setSchema()).toThrow(/Unknown schema/)
  })

  test('unknown custom tag', () => {
    const doc = new YAML.Document({ customTags: ['foo'] })
    expect(() => doc.setSchema()).toThrow(/Unknown custom tag/)
  })
})

test('broken document with comment before first node', () => {
  const doc = YAML.parseDocument('#c\n*x\nfoo\n')
  expect(doc.contents).toMatchObject([null, { type: 'PLAIN' }])
  expect(doc.errors).toMatchObject([
    { name: 'YAMLReferenceError' },
    { name: 'YAMLSyntaxError' }
  ])
})

describe('broken directives', () => {
  for (const tag of ['%TAG', '%YAML'])
    test(`incomplete ${tag} directive`, () => {
      const doc = YAML.parseDocument(`${tag}\n---\n`)
      expect(doc.errors).toMatchObject([
        { name: 'YAMLSemanticError', source: { type: 'DIRECTIVE' } }
      ])
    })

  test('missing separator', () => {
    const doc = YAML.parseDocument(`%YAML 1.2\n`)
    expect(doc.errors).toMatchObject([
      { name: 'YAMLSemanticError', source: { type: 'DOCUMENT' } }
    ])
  })
})

test('multiple tags on one node', () => {
  const doc = YAML.parseDocument('!foo !bar baz\n')
  expect(doc.contents).toMatchObject({ value: 'baz', type: 'PLAIN' })
  expect(doc.errors).toMatchObject([{ name: 'YAMLSemanticError' }])
  expect(doc.warnings).toMatchObject([{}])
})

describe('deprecations', () => {
  let mock
  beforeEach(() => {
    mock = jest.spyOn(global.process, 'emitWarning').mockImplementation()
  })
  afterEach(() => mock.mockRestore())

  describe('env vars', () => {
    let prevAll, prevDeprecations
    beforeEach(() => {
      prevAll = global._YAML_SILENCE_WARNINGS
      prevDeprecations = global._YAML_SILENCE_DEPRECATION_WARNINGS
    })
    afterEach(() => {
      global._YAML_SILENCE_WARNINGS = prevAll
      global._YAML_SILENCE_DEPRECATION_WARNINGS = prevDeprecations
    })

    test('_YAML_SILENCE_WARNINGS', () => {
      global._YAML_SILENCE_WARNINGS = true
      warnFileDeprecation('foo')
      warnOptionDeprecation('bar1', 'baz')
      expect(mock).toHaveBeenCalledTimes(0)
    })

    test('_YAML_SILENCE_DEPRECATION_WARNINGS', () => {
      global._YAML_SILENCE_DEPRECATION_WARNINGS = true
      warnFileDeprecation('foo')
      warnOptionDeprecation('bar2', 'baz')
      expect(mock).toHaveBeenCalledTimes(0)
    })
  })

  test('only warn once', () => {
    warnOptionDeprecation('bar3')
    warnOptionDeprecation('bar3')
    expect(mock).toHaveBeenCalledTimes(1)
  })

  test('without process.emitWarning', () => {
    global.process.emitWarning = null
    const cMock = jest.spyOn(console, 'warn').mockImplementation()
    try {
      warnFileDeprecation('foo')
      warnOptionDeprecation('bar4', 'baz')
      expect(cMock).toHaveBeenCalledTimes(2)
    } finally {
      cMock.mockRestore()
    }
  })

  test('tags option', () => {
    const doc = new YAML.Document({ tags: [] })
    doc.setSchema()
    expect(mock).toHaveBeenCalledTimes(1)
  })

  const files = [
    'map',
    'pair',
    'scalar',
    'schema',
    'seq',
    'types/binary',
    'types/omap',
    'types/pairs',
    'types/set',
    'types/timestamp'
  ]
  for (const file of files)
    test(`file: ${file}`, async () => {
      try {
        await import(`../../${file}`)
      } catch (e) {
        // ignore errors, only testing warnings here
      }
      expect(mock).toHaveBeenCalledTimes(1)
    })
})
