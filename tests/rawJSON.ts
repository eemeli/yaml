import type { YAMLSeq } from 'yaml'
import { Document, Scalar, stringify } from 'yaml'

describe.runIf(JSON.rawJSON)('stringify raw JSON', () => {
  test('quoted string', () => {
    const raw = '"Foo\\n bar"'
    const res = stringify(JSON.rawJSON(raw))
    expect(res).toBe(`${raw}\n`)
  })

  test('long number in array', () => {
    const raw = '9'.repeat(99)
    const res = stringify([JSON.rawJSON(raw)])
    expect(res).toBe(`- ${raw}\n`)
  })
})

describe.runIf(JSON.rawJSON)('node creation', () => {
  test('quoted string in constructor', () => {
    const raw = '"Foo\\n bar"'
    const doc = new Document<Scalar>(JSON.rawJSON(raw))
    expect(doc.value).toBeInstanceOf(Scalar)
    expect(JSON.isRawJSON(doc.value.value)).toBe(true)
    expect(String(doc)).toBe(`${raw}\n`)
  })

  test('long number added to sequence', () => {
    const raw = '9'.repeat(99)
    const doc = new Document<YAMLSeq<any>>([])
    doc.value.push(JSON.rawJSON(raw))
    expect(doc.value[0]).toBeInstanceOf(Scalar)
    expect(String(doc)).toBe(`- ${raw}\n`)
  })
})
