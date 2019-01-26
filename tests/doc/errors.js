import Node from '../../src/cst/Node'
import YAML from '../../src/index'

test('eemeli/yaml#6', () => {
  const src = 'abc: 123\ndef'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toMatchObject([{ name: 'YAMLSemanticError' }])
  const node = doc.errors[0].source
  expect(node).toBeInstanceOf(Node)
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
  })
  test('seq', () => {
    const src = '[ , ]\n---\n[ 123,,, ]\n'
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toMatchObject([{ name: 'YAMLSyntaxError' }])
    expect(docs[1].errors).toMatchObject([
      { name: 'YAMLSyntaxError' },
      { name: 'YAMLSyntaxError' }
    ])
  })
})

test('eemeli/yaml#8', () => {
  const src = '{'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toMatchObject([{ name: 'YAMLSemanticError' }])
})
