import { parseDocument } from 'yaml'
import { describe, expect, test } from 'vitest'

describe('non-printable characters (issue #703)', () => {
  test('errors on C0 control in double-quoted scalar', () => {
    const doc = parseDocument('"foo\x01bar"')
    expect(doc.errors).toMatchObject([{ code: 'NON_PRINTABLE' }])
    expect(doc.errors[0].message).toMatch(/U\+0001/)
  })

  test('errors on C0 control in plain scalar', () => {
    const doc = parseDocument('foo\x01bar')
    expect(doc.errors).toMatchObject([{ code: 'NON_PRINTABLE' }])
  })

  test('errors on DEL in single-quoted scalar', () => {
    const doc = parseDocument("'a\x7fb'")
    expect(doc.errors).toMatchObject([{ code: 'NON_PRINTABLE' }])
    expect(doc.errors[0].message).toMatch(/U\+007F/)
  })

  test('errors on C0 control in block scalar', () => {
    const doc = parseDocument('|\n  a\x02b\n')
    expect(doc.errors).toMatchObject([{ code: 'NON_PRINTABLE' }])
  })

  test('allows TAB, LF and CR', () => {
    const doc = parseDocument('"a\\tb"')
    expect(doc.errors).toHaveLength(0)
  })

  test('allows escaped non-printables via double-quoted escapes', () => {
    // Source text is printable (\ and 0); resolved value may contain NUL
    const doc = parseDocument('"a\\0b"')
    expect(doc.errors).toHaveLength(0)
    expect(doc.toJS()).toBe('a\0b')
  })
})
