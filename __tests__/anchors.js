import YAML from '../src/index'

test('basic', () => {
  const src = `- &a 1\n- *a\n`
  const doc = YAML.parseDocuments(src)[0]
  expect(doc.errors).toHaveLength(0)
  const { items } = doc.contents
  expect(items).toMatchObject([{ value: 1 }, { source: { value: 1 } }])
  expect(items[1].source).toBe(items[0])
  expect(String(doc)).toBe(src)
})

test('re-defined anchor', () => {
  const src = '- &a 1\n- &a 2\n- *a\n'
  const doc = YAML.parseDocuments(src)[0]
  expect(doc.errors).toHaveLength(0)
  const { items } = doc.contents
  expect(items).toMatchObject([
    { value: 1 },
    { value: 2 },
    { source: { value: 2 } }
  ])
  expect(items[2].source).toBe(items[1])
  expect(String(doc)).toBe('- &a1 1\n- &a 2\n- *a\n')
})

test('circular reference', () => {
  const src = '&a [1, *a]\n'
  const doc = YAML.parseDocuments(src)[0]
  expect(doc.errors).toHaveLength(0)
  const { items } = doc.contents
  expect(items).toHaveLength(2)
  expect(items[1].source).toBe(doc.contents)
  expect(() => doc.toJSON()).toThrow() // FIXME
  expect(() => String(doc)).toThrow() // FIXME
})
