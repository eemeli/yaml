import type { YAMLMap, YAMLSeq } from 'yaml'
import { parseDocument } from 'yaml'
import { source } from './_utils.ts'

describe('scalars', () => {
  test('plain', () => {
    const doc = parseDocument('42')
    expect(doc.value.toJS(doc)).toBe(42)
  })

  test('plain in map', () => {
    const doc = parseDocument<YAMLMap, false>('key: 42')
    expect(doc.get('key').toJS(doc)).toBe(42)
  })
})

describe('collections', () => {
  test('map', () => {
    const doc = parseDocument('key: 42')
    expect(doc.value.toJS(doc)).toMatchObject({ key: 42 })
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
