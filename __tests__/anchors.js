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
  const message =
    'Alias node contains a circular reference, which cannot be resolved as JSON'
  expect(doc.errors).toHaveLength(0)
  expect(doc.warnings).toMatchObject([{ message }])
  const { items } = doc.contents
  expect(items).toHaveLength(2)
  expect(items[1].source).toBe(doc.contents)
  expect(() => doc.toJSON()).toThrow(message)
  expect(String(doc)).toBe('&a\n- 1\n- *a\n')
})

describe('create', () => {
  test('doc.anchors.setAnchor', () => {
    const doc = YAML.parseDocuments('[{ a: A }, { b: B }]')[0]
    const {
      items: [a, b]
    } = doc.contents
    expect(doc.anchors.setAnchor(a, 'AA')).toBe('AA')
    expect(doc.anchors.setAnchor(a.items[0].value)).toBe('a1')
    expect(doc.anchors.setAnchor(b.items[0].value)).toBe('a2')
    expect(doc.anchors.setAnchor(null, 'a1')).toBe('a1')
    expect(doc.anchors.getName(a)).toBe('AA')
    expect(doc.anchors.getNode('a2').value).toBe('B')
    expect(String(doc)).toBe('- &AA\n  a: A\n- b: &a2 B\n')
  })

  test('doc.anchors.createAlias', () => {
    const doc = YAML.parseDocuments('[{ a: A }, { b: B }]')[0]
    const {
      items: [a, b]
    } = doc.contents
    const alias = doc.anchors.createAlias(a, 'AA')
    doc.contents.items.push(alias)
    expect(doc.toJSON()).toMatchObject([{ a: 'A' }, { b: 'B' }, { a: 'A' }])
    expect(String(doc)).toMatch('- &AA\n  a: A\n- b: B\n- *AA\n')
  })
})
