import { isAlias, isScalar, parseDocument, Scalar, visit, YAMLMap } from 'yaml'
import { source } from './_utils'

describe('doc.clone()', () => {
  test('has expected members', () => {
    const doc = parseDocument('foo: bar')
    const copy = doc.clone()
    expect(copy).toMatchObject({
      comment: null,
      commentBefore: null,
      errors: [],
      warnings: []
    })
  })

  test('has expected methods', () => {
    const doc = parseDocument('foo: bar')
    const copy = doc.clone()
    expect(copy.toString()).toBe('foo: bar\n')
    expect(copy.toJS()).toEqual({ foo: 'bar' })

    const node = copy.createNode(42)
    expect(isScalar(node)).toBe(true)
    expect(node).toMatchObject({ value: 42 })

    const alias = copy.createAlias(node as Scalar, 'foo')
    expect(isAlias(alias)).toBe(true)
    expect(alias).toMatchObject({ source: 'foo' })
  })

  test('has separate contents from original', () => {
    const doc = parseDocument('foo: bar')
    const copy = doc.clone()
    copy.set('foo', 'fizz')
    expect(doc.get('foo')).toBe('bar')
    expect(copy.get('foo')).toBe('fizz')
  })

  test('has separate directives from original', () => {
    const doc = parseDocument<YAMLMap, false>('foo: bar')
    const copy = doc.clone()
    copy.directives.yaml.explicit = true
    expect(copy.toString()).toBe(source`
      %YAML 1.2
      ---
      foo: bar
    `)
    expect(doc.toString()).toBe('foo: bar\n')
  })

  test('handles anchors & aliases', () => {
    const src = source`
      foo: &foo FOO
      bar: *foo
    `
    const doc = parseDocument(src)
    const copy = doc.clone()
    expect(copy.toString()).toBe(src)

    visit(doc, {
      Alias(_, it) {
        if (it.source === 'foo') it.source = 'x'
      },
      Node(_, it) {
        if (it.anchor === 'foo') it.anchor = 'x'
      }
    })
    expect(doc.toString()).toBe(source`
      foo: &x FOO
      bar: *x
    `)
    expect(copy.toString()).toBe(src)
  })
})
