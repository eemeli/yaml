import { parse, parseDocument } from 'yaml'
import { source } from './_utils'

describe('relative-path alias', () => {
  test('resolves a map value by key', () => {
    const src = source`
      - &a { foo: 1 }
      - *a/foo
    `
    expect(parse(src, { version: 'next' })).toEqual([{ foo: 1 }, 1])
  })

  test('resolves a sequence value by index', () => {
    const src = source`
      - &a [ 2, 4, 8 ]
      - *a/1
    `
    expect(parse(src, { version: 'next' })).toEqual([[2, 4, 8], 4])
  })

  test('resolves a deeper value', () => {
    const src = source`
      - &a { foo: [1, 42] }
      - *a/foo/1
    `
    expect(parse(src, { version: 'next' })).toEqual([{ foo: [1, 42] }, 42])
  })

  test('resolves to an equal value', () => {
    const src = source`
      - &a { foo: [42] }
      - *a/foo
    `
    const res = parse(src, { version: 'next' })
    expect(res[1]).toBe(res[0].foo)
  })

  test('does not resolve an alias value', () => {
    const src = source`
      - &a { foo: *a }
      - *a/foo
    `
    const doc = parseDocument(src, { version: 'next' })
    expect(() => doc.toJS()).toThrow(ReferenceError)
  })

  test('does not resolve a later value', () => {
    const src = source`
      - *a/foo
      - &a { foo: 1 }
    `
    const doc = parseDocument(src, { version: 'next' })
    expect(() => doc.toJS()).toThrow(ReferenceError)
  })
})
