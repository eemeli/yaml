import YAML from '../src/index'
import Map from '../src/schema/Map'
import Merge from '../src/schema/Merge'

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

describe('merge <<', () => {
  const src = `---
- &CENTER { x: 1, y: 2 }
- &LEFT { x: 0, y: 2 }
- &BIG { r: 10 }
- &SMALL { r: 1 }

# All the following maps are equal:

- # Explicit keys
  x: 1
  y: 2
  r: 10
  label: center/big

- # Merge one map
  << : *CENTER
  r: 10
  label: center/big

- # Merge multiple maps
  << : [ *CENTER, *BIG ]
  label: center/big

- # Override
  << : [ *BIG, *LEFT, *SMALL ]
  x: 1
  label: center/big`

  test('YAML.parse', () => {
    const res = YAML.parse(src, { merge: true })
    expect(res).toHaveLength(8)
    for (let i = 4; i < res.length; ++i) {
      expect(res[i]).toMatchObject({ x: 1, y: 2, r: 10, label: 'center/big' })
    }
  })

  test('YAML.parse with merge:false', () => {
    const res = YAML.parse(src)
    expect(res).toHaveLength(8)
    for (let i = 5; i < res.length; ++i) {
      expect(res[i]).toHaveProperty('<<')
    }
  })

  test('YAML.parseDocuments', () => {
    const doc = YAML.parseDocuments(src, { merge: true })[0]
    expect(doc.contents.items).toHaveLength(8)
    expect(Object.keys(doc.anchors.map)).toMatchObject([
      'CENTER',
      'LEFT',
      'BIG',
      'SMALL'
    ])
    doc.contents.items.slice(5).forEach(({ items }) => {
      const merge = items[0]
      expect(merge).toBeInstanceOf(Merge)
      merge.value.items.forEach(({ source }) => {
        expect(source).toBeInstanceOf(Map)
      })
    })
  })

  test('doc.anchors.createMergePair', () => {
    const doc = YAML.parseDocuments('[{ a: A }, { b: B }]')[0]
    const {
      items: [a, b]
    } = doc.contents
    const merge = doc.anchors.createMergePair(a)
    b.items.push(merge)
    expect(doc.toJSON()).toMatchObject([{ a: 'A' }, { a: 'A', b: 'B' }])
    expect(String(doc)).toBe('- &a1\n  a: A\n- b: B\n  <<: *a1\n')
  })

  describe('parse errors', () => {
    test('non-alias merge value', () => {
      const src = '{ <<: A, B: b }'
      expect(() => YAML.parse(src, { merge: true })).toThrow(
        'Merge nodes can only have Alias nodes as values'
      )
    })

    test('non-map alias', () => {
      const src = '- &A a\n- { <<: *A, B: b }'
      expect(() => YAML.parse(src, { merge: true })).toThrow(
        'Merge nodes aliases can only point to maps'
      )
    })

    test('circular reference', () => {
      const src = '&A { <<: *A, B: b }'
      const doc = YAML.parseDocuments(src, { merge: true })[0]
      expect(doc.errors).toHaveLength(0)
      const message =
        'Alias node contains a circular reference, which cannot be resolved as JSON'
      expect(doc.warnings).toMatchObject([{ message }])
      expect(() => doc.toJSON()).toThrow(message)
      expect(String(doc)).toBe('&A\n<<: *A\nB: b\n')
    })
  })

  describe('stringify', () => {
    test('example', () => {
      const doc = YAML.parseDocuments(src, { merge: true })[0]
      expect(YAML.parse(String(doc), { merge: true })).toMatchObject([
        { x: 1, y: 2 },
        { x: 0, y: 2 },
        { r: 10 },
        { r: 1 },
        { label: 'center/big', r: 10, x: 1, y: 2 },
        { label: 'center/big', r: 10, x: 1, y: 2 },
        { label: 'center/big', r: 10, x: 1, y: 2 },
        { label: 'center/big', r: 10, x: 1, y: 2 }
      ])
    })
  })
})
