import { parseDocument, Scalar } from 'yaml'
import { source } from './_utils'

describe('%TAG', () => {
  test('parse', () => {
    const doc = parseDocument(source`
      %TAG ! !foo:
      %TAG !bar! !bar:
      ---
      - !bar v1
      - !bar!foo v2
    `)
    expect(doc.errors).toHaveLength(0)
    expect(doc.directives.tags).toMatchObject({
      '!!': 'tag:yaml.org,2002:',
      '!': '!foo:',
      '!bar!': '!bar:'
    })
    expect(doc.contents).toMatchObject({
      items: [
        { value: 'v1', tag: '!foo:bar' },
        { value: 'v2', tag: '!bar:foo' }
      ]
    })
  })

  test('create & stringify', () => {
    const doc = parseDocument('[ v1, v2 ]\n')
    ;(doc.get(0, true) as Scalar).tag = '!foo:foo'
    ;(doc.get(1, true) as Scalar).tag = '!bar:bar'
    doc.directives.tags['!'] = '!foo:'
    doc.directives.tags['!bar!'] = '!bar:'
    expect(String(doc)).toBe(source`
      %TAG ! !foo:
      %TAG !bar! !bar:
      ---
      [ !foo v1, !bar!bar v2 ]
    `)
  })
})
