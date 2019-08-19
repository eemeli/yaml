import Node from '../../src/cst/Node'
import YAML from '../../src/index'

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
})
