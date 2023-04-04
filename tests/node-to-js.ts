import { parseDocument, YAMLMap, YAMLSeq } from 'yaml'
import { source } from './_utils'

describe('scalars', () => {
  test('plain', () => {
    const doc = parseDocument('42')
    expect(doc.contents?.toJS(doc)).toBe(42)
  })

  test('plain in map', () => {
    const doc = parseDocument<YAMLMap, false>('key: 42')
    expect(doc.get('key', true).toJS(doc)).toBe(42)
  })
})

describe('collections', () => {
  test('map', () => {
    const doc = parseDocument('key: 42')
    expect(doc.contents?.toJS(doc)).toMatchObject({ key: 42 })
  })

  test('map in seq', () => {
    const doc = parseDocument<YAMLSeq, false>('- key: 42')
    expect(doc.get(0).toJS(doc)).toMatchObject({ key: 42 })
  })
})

describe('alias', () => {
  test('simple', () => {
    const doc = parseDocument<YAMLMap, false>(source`
      one: &a 42
      two: *a
    `)
    expect(doc.get('two').toJS(doc)).toBe(42)
  })

  test('repeated identifier', () => {
    const doc = parseDocument<YAMLMap, false>(source`
      one: &a 13
      two: &a 42
      three: *a
      four: &a 99
    `)
    expect(doc.get('three').toJS(doc)).toBe(42)
  })

  test('nested aliases', () => {
    const doc = parseDocument<YAMLMap, false>(source`
      one: &a 42
      two: &b { key: *a }
      three: *b
    `)
    expect(doc.get('three').toJS(doc)).toMatchObject({ key: 42 })
  })

  test('missing anchor', () => {
    const doc = parseDocument<YAMLMap, false>(source`
      one: &a 42
      two: *b
    `)
    expect(() => doc.get('two').toJS(doc)).toThrow(ReferenceError)
  })
})

describe('options', () => {
  test('doc is required', () => {
    const doc = parseDocument('key: 42')
    expect(() => doc.contents?.toJS({} as any)).toThrow(TypeError)
  })

  test('mapAsMap', () => {
    const doc = parseDocument('key: 42')
    expect(doc.contents?.toJS(doc, { mapAsMap: true })).toMatchObject(
      new Map([['key', 42]])
    )
  })

  test('onAnchor', () => {
    const doc = parseDocument<YAMLMap, false>(source`
      one: &a 42
      two: &b { key: *a }
      three: *b
    `)
    const onAnchor = jest.fn()
    doc.get('three').toJS(doc, { onAnchor })
    expect(onAnchor.mock.calls).toMatchObject([
      [{ key: 42 }, 2],
      [42, 2]
    ])
  })

  test('reviver', () => {
    const doc = parseDocument<YAMLMap, false>(source`
      one: &a 42
      two: &b { key: *a }
      three: *b
    `)
    const reviver = jest.fn((_key, value) => value)
    doc.get('three').toJS(doc, { reviver })
    expect(reviver.mock.calls).toMatchObject([
      ['key', 42],
      ['', { key: 42 }]
    ])
  })
})
