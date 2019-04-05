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

test('eemeli/yaml#8', () => {
  const src = '{'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toMatchObject([{ name: 'YAMLSemanticError' }])
  const node = doc.errors[0].source
  expect(node).toBeInstanceOf(Node)
  expect(node.rangeAsLinePos).toMatchObject({
    start: { line: 1, col: 1 },
    end: { line: 1, col: 2 }
  })
})

describe('pretty errors', () => {
  test('eemeli/yaml#6', () => {
    const src = 'abc: 123\ndef'
    const doc = YAML.parseDocument(src, { prettyErrors: true })
    expect(doc.errors).toMatchObject([
      {
        name: 'YAMLSemanticError',
        message: 'Implicit map keys need to be followed by map values',
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
        message: 'Flow map contains an unexpected ,',
        nodeType: 'FLOW_MAP',
        range: { start: 0, end: 5 },
        linePos: { start: { line: 1, col: 1 }, end: { line: 1, col: 6 } }
      }
    ])
    expect(docs[0].errors[0]).not.toHaveProperty('source')
    expect(docs[1].errors).toMatchObject([
      {
        name: 'YAMLSyntaxError',
        message: 'Flow map contains an unexpected ,',
        nodeType: 'FLOW_MAP',
        range: { start: 10, end: 20 },
        linePos: { start: { line: 3, col: 1 }, end: { line: 3, col: 11 } }
      },
      {
        name: 'YAMLSyntaxError',
        message: 'Flow map contains an unexpected ,',
        nodeType: 'FLOW_MAP',
        range: { start: 10, end: 20 },
        linePos: { start: { line: 3, col: 1 }, end: { line: 3, col: 11 } }
      }
    ])
    expect(docs[1].errors[0]).not.toHaveProperty('source')
    expect(docs[1].errors[1]).not.toHaveProperty('source')
  })
})
