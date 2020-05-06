import { YAML } from '../../src/index.js'
import { Merge, YAMLMap } from '../../src/ast/index.js'

test('basic', () => {
  const src = `- &a 1\n- *a\n`
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toHaveLength(0)
  const { items } = doc.contents
  expect(items).toMatchObject([{ value: 1 }, { source: { value: 1 } }])
  expect(items[1].source).toBe(items[0])
  expect(String(doc)).toBe(src)
})

test('re-defined anchor', () => {
  const src = '- &a 1\n- &a 2\n- *a\n'
  const doc = YAML.parseDocument(src)
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
  const src = '&a [ 1, *a ]\n'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toHaveLength(0)
  expect(doc.warnings).toHaveLength(0)
  const { items } = doc.contents
  expect(items).toHaveLength(2)
  expect(items[1].source).toBe(doc.contents)
  const res = doc.toJSON()
  expect(res[1]).toBe(res)
  expect(String(doc)).toBe(src)
})

describe('create', () => {
  test('doc.anchors.setAnchor', () => {
    const doc = YAML.parseDocument('[{ a: A }, { b: B }]')
    const [a, b] = doc.contents.items
    expect(doc.anchors.setAnchor(null, null)).toBe(null)
    expect(doc.anchors.setAnchor(a, 'XX')).toBe('XX')
    expect(doc.anchors.setAnchor(a, 'AA')).toBe('AA')
    expect(doc.anchors.setAnchor(a, 'AA')).toBe('AA')
    expect(doc.anchors.setAnchor(a)).toBe('AA')
    expect(doc.anchors.setAnchor(a.items[0].value)).toBe('a1')
    expect(doc.anchors.setAnchor(b.items[0].value)).toBe('a2')
    expect(doc.anchors.setAnchor(null, 'a1')).toBe('a1')
    expect(doc.anchors.getName(a)).toBe('AA')
    expect(doc.anchors.getNode('a2').value).toBe('B')
    expect(String(doc)).toBe('[ &AA { a: A }, { b: &a2 B } ]\n')
    expect(() => doc.anchors.setAnchor(a.items[0])).toThrow(
      'Anchors may only be set for Scalar, Seq and Map nodes'
    )
    expect(() => doc.anchors.setAnchor(a, 'A A')).toThrow(
      'Anchor names must not contain whitespace or control characters'
    )
    expect(doc.anchors.getNames()).toMatchObject(['AA', 'a1', 'a2'])
  })

  test('doc.anchors.createAlias', () => {
    const doc = YAML.parseDocument('[{ a: A }, { b: B }]')
    const alias = doc.anchors.createAlias(doc.contents.items[0], 'AA')
    doc.contents.items.push(alias)
    expect(doc.toJSON()).toMatchObject([{ a: 'A' }, { b: 'B' }, { a: 'A' }])
    expect(String(doc)).toMatch('[ &AA { a: A }, { b: B }, *AA ]\n')
  })

  test('errors', () => {
    const doc = YAML.parseDocument('[{ a: A }, { b: B }]')
    const node = doc.contents.items[0]
    const alias = doc.anchors.createAlias(node, 'AA')
    doc.contents.items.unshift(alias)
    expect(() => String(doc)).toThrow('Alias node must be after source node')
    expect(() => {
      alias.tag = 'tag:yaml.org,2002:alias'
    }).toThrow('Alias nodes cannot have tags')
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

  test('YAML.parseAllDocuments', () => {
    const doc = YAML.parseDocument(src, { merge: true })
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
        expect(source).toBeInstanceOf(YAMLMap)
      })
    })
  })

  describe('doc.anchors.createMergePair', () => {
    test('simple case', () => {
      const doc = YAML.parseDocument('[{ a: A }, { b: B }]')
      const [a, b] = doc.contents.items
      const merge = doc.anchors.createMergePair(a)
      b.items.push(merge)
      expect(doc.toJSON()).toMatchObject([{ a: 'A' }, { a: 'A', b: 'B' }])
      expect(String(doc)).toBe('[ &a1 { a: A }, { b: B, <<: *a1 } ]\n')
    })

    test('merge pair of an alias', () => {
      const doc = YAML.parseDocument('[{ a: A }, { b: B }]')
      const [a, b] = doc.contents.items
      const alias = doc.anchors.createAlias(a, 'AA')
      const merge = doc.anchors.createMergePair(alias)
      b.items.push(merge)
      expect(doc.toJSON()).toMatchObject([{ a: 'A' }, { a: 'A', b: 'B' }])
      expect(String(doc)).toBe('[ &AA { a: A }, { b: B, <<: *AA } ]\n')
    })

    test('require map node', () => {
      const exp = 'Merge sources must be Map nodes or their Aliases'
      const doc = YAML.parseDocument('[{ a: A }, { b: B }]')
      const [a] = doc.contents.items
      const merge = doc.anchors.createMergePair(a)
      expect(() => doc.anchors.createMergePair(merge)).toThrow(exp)
      const alias = doc.anchors.createAlias(a.items[0].value)
      expect(() => doc.anchors.createMergePair(alias)).toThrow(exp)
    })
  })

  describe('merge multiple times', () => {
    const srcKeys = `
x:
  - &a
    k0: v1
    k1: v1
  - &b
    k1: v2
    k2: v2
y:
  k0: v0
  <<: *a
  <<: *b`

    const srcSeq = `
x:
  - &a
    k0: v1
    k1: v1
  - &b
    k1: v2
    k2: v2
y:
  k0: v0
  <<: [ *a, *b ]`

    const expObj = {
      x: [
        { k0: 'v1', k1: 'v1' },
        { k1: 'v2', k2: 'v2' }
      ],
      y: { k0: 'v0', k1: 'v1', k2: 'v2' }
    }

    const expMap = new Map([
      [
        'x',
        [
          new Map([
            ['k0', 'v1'],
            ['k1', 'v1']
          ]),
          new Map([
            ['k1', 'v2'],
            ['k2', 'v2']
          ])
        ]
      ],
      [
        'y',
        new Map([
          ['k0', 'v0'],
          ['k1', 'v1'],
          ['k2', 'v2']
        ])
      ]
    ])

    test('multiple merge keys, masAsMap: false', () => {
      const res = YAML.parse(srcKeys, { merge: true })
      expect(res).toEqual(expObj)
    })

    test('multiple merge keys, masAsMap: true', () => {
      const res = YAML.parse(srcKeys, { merge: true, mapAsMap: true })
      expect(res).toEqual(expMap)
    })

    test('sequence of anchors, masAsMap: false', () => {
      const res = YAML.parse(srcSeq, { merge: true })
      expect(res).toEqual(expObj)
    })

    test('sequence of anchors, masAsMap: true', () => {
      const res = YAML.parse(srcSeq, { merge: true, mapAsMap: true })
      expect(res).toEqual(expMap)
    })
  })

  test('do not throw error when key is null', () => {
    const src = ': 123'
    expect(() => YAML.parse(src, { merge: true })).not.toThrow()
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
      const src = '&A { <<: *A, B: b }\n'
      const doc = YAML.parseDocument(src, { merge: true })
      expect(doc.errors).toHaveLength(0)
      expect(doc.warnings).toHaveLength(0)
      expect(() => doc.toJSON()).toThrow('Maximum call stack size exceeded')
      expect(String(doc)).toBe(src)
    })
  })

  describe('stringify', () => {
    test('example', () => {
      const doc = YAML.parseDocument(src, { merge: true })
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
