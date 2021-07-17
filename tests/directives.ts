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

describe('broken directives', () => {
  for (const tag of ['%TAG', '%YAML'])
    test(`incomplete ${tag} directive`, () => {
      const doc = parseDocument(`${tag}\n---\n`)
      expect(doc.errors).toMatchObject([{ pos: [0, tag.length] }])
    })

  test('missing separator at end of stream', () => {
    const doc = parseDocument(`%YAML 1.2\n`)
    expect(doc.errors).toMatchObject([{ pos: [10, 11] }])
  })

  test('missing separator before doc contents', () => {
    const doc = parseDocument(`%YAML 1.2\nfoo\n`)
    expect(doc.errors).toMatchObject([{ pos: [10, 11] }])
  })

  test('lone %', () => {
    const doc = parseDocument(`%`)
    expect(doc).toMatchObject({
      errors: [{ code: 'MISSING_CHAR', pos: [1, 2] }],
      warnings: [{ code: 'BAD_DIRECTIVE', pos: [0, 1] }]
    })
  })
})
