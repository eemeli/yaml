import type { Scalar, YAMLMap, YAMLSeq } from 'yaml'
import { Alias, Document, parse, parseDocument } from 'yaml'
import { _map } from '../_utils.ts'

test('basic', () => {
  const src = `- &a 1\n- *a\n`
  const doc = parseDocument<YAMLSeq<Alias>>(src)
  expect(doc.errors).toHaveLength(0)
  expect(doc.value).toMatchObject([{ anchor: 'a', value: 1 }, { source: 'a' }])
  expect(String(doc)).toBe(src)
  expect(doc.get(1)!.resolve(doc)).toBe(doc.get(0))
})

test('re-defined anchor', () => {
  const src = '- &a 1\n- &a 2\n- *a\n'
  const doc = parseDocument<YAMLSeq>(src)
  expect(doc.errors).toHaveLength(0)
  expect(doc.value).toMatchObject([
    { anchor: 'a', value: 1 },
    { anchor: 'a', value: 2 },
    { source: 'a' }
  ])
  expect(doc.toJS()).toMatchObject([1, 2, 2])
  expect(String(doc)).toBe('- &a 1\n- &a 2\n- *a\n')
})

describe('alias resolution cache', () => {
  test('uses the preceding anchor for each alias', () => {
    const doc = parseDocument('[&a [1], *a, &a [2], *a, &a [3]]')
    const res = doc.toJS()
    expect(res).toEqual([[1], [1], [2], [2], [3]])
    expect(res[1]).toBe(res[0])
    expect(res[3]).toBe(res[2])
  })

  test.each(['[*a, &a 1]', '[*missing]', '[&b 1, *b, *a, &a 2]'])(
    'rejects unresolved aliases in %s',
    src => {
      const doc = parseDocument(src)
      expect(doc.errors).toHaveLength(0)
      expect(() => doc.toJS()).toThrow('Unresolved alias')
    }
  )

  test('a detached alias uses the last matching anchor', () => {
    const doc = parseDocument<YAMLSeq>('[&a 1, &a { value: 2 }]')
    const alias = new Alias('a')
    expect(alias.resolve(doc)).toBe(doc.get(1))
    expect(alias.toJS(doc)).toEqual({ value: 2 })
    expect(() => new Alias('missing').toJS(doc)).toThrow('Unresolved alias')
  })

  test('a detached alias resolves nested aliases in document order', () => {
    const doc = parseDocument('[&a 1, &b [*a], &a 2]')
    expect(new Alias('b').toJS(doc)).toEqual([1])
  })

  test('a repeated alias instance uses its first position', () => {
    const doc = parseDocument<YAMLSeq>('[&a 1, *a, &a 2]')
    doc.value.push(doc.get(1)!)
    expect(doc.toJS()).toEqual([1, 1, 2, 1])
  })

  test('a repeated unresolved alias stays unresolved', () => {
    const doc = parseDocument<YAMLSeq>('[*a, &a 1]')
    const alias = doc.get(0) as Alias
    doc.value.push(alias)
    expect(alias.resolve(doc)).toBeUndefined()
    expect(() => alias.toJS(doc)).toThrow('Unresolved alias')
  })

  test('fresh calls reflect document edits', () => {
    const doc = parseDocument<YAMLSeq>('[&a 1, *a, &a 2]')
    const alias = doc.get(1) as Alias
    expect(doc.toJS()).toEqual([1, 1, 2])
    const last = doc.value.pop()!
    doc.value.unshift(last)
    expect(doc.toJS()).toEqual([2, 1, 1])
    expect(alias.resolve(doc)).toBe(doc.get(1))
    const first = doc.get(1) as Scalar
    first.anchor = 'b'
    expect(alias.resolve(doc)).toBe(last)
    expect(doc.toJS()).toEqual([2, 1, 2])
    alias.source = 'b'
    expect(alias.resolve(doc)).toBe(doc.get(1))
    expect(doc.toJS()).toEqual([2, 1, 1])
  })

  test('enforces alias limits even after caching', () => {
    const doc = parseDocument('[&a 1, *a, *a]')
    expect(() => doc.toJS({ maxAliasCount: 0 })).toThrow(
      'Alias resolution is disabled'
    )
    expect(() => doc.toJS({ maxAliasCount: 2 })).toThrow(
      'Excessive alias count'
    )
    expect(doc.toJS({ maxAliasCount: 3 })).toEqual([1, 1, 1])
    expect(doc.toJS({ maxAliasCount: -1 })).toEqual([1, 1, 1])
  })

  test.each([64, 128, 256])(
    'anchor lookups grow linearly for %i distinct anchors',
    size => {
      const doc = new Document<YAMLSeq<Scalar | Alias>>(new Array(size).fill(0))
      let reads = 0
      for (let i = 0; i < size; ++i) {
        const node = doc.value[i] as Scalar
        Object.defineProperty(node, 'anchor', {
          get() {
            reads += 1
            return `a${i}`
          }
        })
        doc.value.push(new Alias(`a${i}`))
      }
      expect(doc.toJS()).toEqual(new Array(2 * size).fill(0))
      expect(reads).toBeLessThanOrEqual(8 * size)
    }
  )
})

test('circular reference', () => {
  const src = '&a [ 1, *a ]\n'
  const doc = parseDocument<YAMLSeq<Alias>>(src)
  expect(doc.errors).toHaveLength(0)
  expect(doc.warnings).toHaveLength(0)
  expect(doc.value).toMatchObject([{ value: 1 }, { source: 'a' }])
  expect(doc.value.anchor).toBe('a')
  const res = doc.toJS()
  expect(res[1]).toBe(res)
  expect(String(doc)).toBe(src)
  expect(doc.get(1)!.resolve(doc)).toBe(doc.value)
})

describe('anchor on tagged collection', () => {
  test('!!set', () => {
    const res = parse('- &a !!set { 1, 2 }\n- *a\n')
    expect(res[0]).toMatchObject(new Set([1, 2]))
    expect(res[1]).toBe(res[0])
  })

  test('!!omap', () => {
    const res = parse('- &a !!omap [ 1: 1, 2: 2 ]\n- *a\n')
    expect(res[0]).toMatchObject(
      new Map([
        [1, 1],
        [2, 2]
      ])
    )
    expect(res[1]).toBe(res[0])
  })
})

describe('create', () => {
  test('node.anchor', () => {
    const doc = parseDocument<YAMLSeq<YAMLMap>>('[{ a: A }, { b: B }]')
    doc.get(0)!.anchor = 'AA'
    doc.get(0)!.get('a')!.anchor = 'a'
    doc.get(0)!.get('a')!.anchor = ''
    doc.get(1)!.get('b')!.anchor = 'BB'
    expect(String(doc)).toBe('[ &AA { a: A }, { b: &BB B } ]\n')
  })

  test('doc.createAlias', () => {
    const doc = parseDocument<YAMLSeq<any>>('[{ a: A }, { b: B }]')
    const alias = doc.createAlias(doc.get(0), 'AA')
    doc.value.push(alias)
    expect(doc.toJS()).toMatchObject([{ a: 'A' }, { b: 'B' }, { a: 'A' }])
    const alias2 = doc.createAlias(doc.get(1), 'AA')
    expect(doc.get(1).anchor).toBe('AA1')
    expect(alias2.source).toBe('AA1')
    expect(String(doc)).toMatch('[ &AA { a: A }, &AA1 { b: B }, *AA ]\n')
  })

  test('repeated Array in createNode', () => {
    const doc = new Document()
    const ref: unknown[] = []
    const node = doc.createNode({ src: ref, ref })
    expect(node).toMatchObject(_map({ src: [], ref: { source: 'a1' } }))
    expect(node.get('src')!.anchor).toBe('a1')
  })

  test('repeated Date in createNode', () => {
    const doc = new Document()
    const date = new Date()
    const value = date.toJSON()
    const node = doc.createNode({ src: date, ref: date })
    expect(node).toMatchObject(
      _map({ src: { value, anchor: 'a1' }, ref: { source: 'a1' } })
    )
  })
})

describe('errors', () => {
  test('invalid anchor characters', () => {
    const doc = parseDocument<YAMLSeq<YAMLMap>>('[{ a: A }, { b: B }]')
    doc.get(0)!.anchor = 'A A'
    expect(() => String(doc)).toThrow(
      'Anchor must not contain whitespace or control characters: "A A"'
    )
  })

  test('set tag on alias', () => {
    const doc = parseDocument<YAMLSeq<YAMLMap>>('[{ a: A }, { b: B }]')
    const node = doc.value[0]
    const alias = doc.createAlias(node, 'AA')
    expect(() => {
      // @ts-expect-error This is intentionally wrong.
      alias.tag = 'tag:yaml.org,2002:alias'
    }).toThrow('Alias nodes cannot have tags')
  })

  test('alias before anchor', () => {
    const doc = parseDocument<YAMLSeq<any>>('[{ a: A }, { b: B }]')
    const alias = doc.createAlias(doc.get(0), 'AA')
    doc.value.unshift(alias)
    expect(() => String(doc)).toThrow(
      'Unresolved alias (the anchor must be set before the alias): AA'
    )
  })

  test('empty alias', () => {
    const doc = parseDocument('- *\n')
    expect(doc.errors).toMatchObject([{ code: 'BAD_ALIAS' }])
  })

  test('empty anchor on value', () => {
    const doc = parseDocument('- & foo\n')
    expect(doc.errors).toMatchObject([{ code: 'BAD_ALIAS' }])
  })

  test('empty anchor at end', () => {
    const doc = parseDocument('- &\n')
    expect(doc.errors).toMatchObject([{ code: 'BAD_ALIAS' }])
  })

  test('resolution with maxAliasCount:0', () => {
    const src = `- &a 1\n- *a\n`
    const doc = parseDocument<YAMLSeq<any>>(src)
    expect(doc.errors).toHaveLength(0)
    expect(() => doc.get(1).resolve(doc, { maxAliasCount: 0 })).toThrow(
      ReferenceError
    )
  })

  test('circular reference', () => {
    const src = '&A { <<: *A, B: b }\n'
    const doc = parseDocument(src, { merge: true })
    expect(doc.errors).toHaveLength(0)
    expect(doc.warnings).toHaveLength(0)
    expect(() => doc.toJS()).toThrow(
      'Excessive alias count indicates a resource exhaustion attack'
    )
    expect(() => doc.toJS({ maxAliasCount: 0 })).toThrow(ReferenceError)
    expect(() => doc.toJS({ maxAliasCount: 1 })).toThrow(ReferenceError)
    expect(() => doc.toJS({ maxAliasCount: 2 })).toThrow(ReferenceError)
    expect(String(doc)).toBe(src)
  })
})

describe('warnings', () => {
  test('anchor ending in colon', () => {
    const doc = parseDocument('- &x:\n')
    expect(doc.errors).toHaveLength(0)
    expect(doc.warnings).toMatchObject([{ code: 'BAD_ALIAS' }])
  })

  test('alias ending in colon', () => {
    const doc = parseDocument('- *x:\n')
    expect(doc.errors).toHaveLength(0)
    expect(doc.warnings).toMatchObject([{ code: 'BAD_ALIAS' }])
  })
})

describe('__proto__ as anchor name', () => {
  test('parse', () => {
    const src = `- &__proto__ 1\n- *__proto__\n`
    const doc = parseDocument<YAMLSeq>(src)
    expect(doc.errors).toHaveLength(0)
    expect(doc.value).toMatchObject([
      { anchor: '__proto__', value: 1 },
      { source: '__proto__' }
    ])
    expect(doc.toJS()).toMatchObject([1, 1])
    expect(String(doc)).toBe(src)
  })

  test('create/stringify', () => {
    const doc = parseDocument<YAMLSeq<any>>('[{ a: A }, { b: B }]')
    const alias = doc.createAlias(doc.value[0], '__proto__')
    doc.value.push(alias)
    expect(doc.toJS()).toMatchObject([{ a: 'A' }, { b: 'B' }, { a: 'A' }])
    expect(String(doc)).toMatch(
      '[ &__proto__ { a: A }, { b: B }, *__proto__ ]\n'
    )
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

- # Override with explicit tag
  !!merge << : [ *BIG, *LEFT, *SMALL ]
  x: 1
  label: center/big`

  test('YAML.parse with merge:true', () => {
    const res = parse(src, { merge: true })
    expect(res).toHaveLength(8)
    for (let i = 4; i < res.length; ++i) {
      expect(res[i]).toMatchObject({ x: 1, y: 2, r: 10, label: 'center/big' })
    }
  })

  test('YAML.parse with customTags:["merge"]', () => {
    const res = parse(src, { customTags: ['merge'] })
    expect(res).toHaveLength(8)
    for (let i = 4; i < res.length; ++i) {
      expect(res[i]).toMatchObject({ x: 1, y: 2, r: 10, label: 'center/big' })
    }
  })

  test('YAML.parse with merge:false', () => {
    const res = parse(src)
    expect(res).toHaveLength(8)
    for (let i = 5; i < res.length - 1; ++i) {
      expect(res[i]).toHaveProperty('<<')
    }
    expect(res[res.length - 1]).toMatchObject({
      x: 1,
      y: 2,
      r: 10,
      label: 'center/big'
    })
  })

  test('YAML.parseDocument', () => {
    const doc = parseDocument<YAMLSeq<YAMLMap>>(src, { merge: true })
    expect(
      doc.value.slice(5).map(it => it.values.values().next().value!.value)
    ).toMatchObject([
      { source: 'CENTER' },
      [{ source: 'CENTER' }, { source: 'BIG' }],
      [{ source: 'BIG' }, { source: 'LEFT' }, { source: 'SMALL' }]
    ])
  })

  test('alias is associated with a sequence', () => {
    const res = parse('- &items [{ a: A }, { b: B }]\n- { <<: *items, c: C }', {
      merge: true
    })
    expect(res[1]).toEqual({ a: 'A', b: 'B', c: 'C' })
  })

  describe('non-alias merges', () => {
    test('single map', () => {
      const res = parse('{ <<: { a: A }, b: B }', { merge: true })
      expect(res).toEqual({ a: 'A', b: 'B' })
    })

    test('multiple maps', () => {
      const res = parse('{ <<: [{ a: A }, { b: B }], c: C }', {
        merge: true
      })
      expect(res).toEqual({ a: 'A', b: 'B', c: 'C' })
    })

    test('mixed refs & maps', () => {
      const res = parse('{ <<: [{ a: &a { A: 1 } }, *a], b: B }', {
        merge: true
      })
      expect(res).toEqual({ a: { A: 1 }, A: 1, b: 'B' })
    })
  })

  describe('create', () => {
    test('simple case', () => {
      const doc = parseDocument<YAMLSeq<YAMLMap>>('[{ a: A }, { b: B }]', {
        merge: true
      })
      const merge = doc.createMergePair({ c: 'C' })
      doc.value[1].set(merge)
      expect(doc.toJS()).toMatchObject([{ a: 'A' }, { b: 'B', c: 'C' }])
      expect(String(doc)).toBe('[ { a: A }, { b: B, <<: { c: C } } ]\n')
    })

    test('using customTags:["merge"]', () => {
      const doc = parseDocument<YAMLSeq<YAMLMap>>('[{ a: A }, { b: B }]', {
        customTags: ['merge']
      })
      const [a, b] = doc.value
      const merge = doc.createMergePair(doc.createAlias(a))
      b.set(merge)
      expect(doc.toJS()).toMatchObject([{ a: 'A' }, { a: 'A', b: 'B' }])
      expect(String(doc)).toBe('[ &a1 { a: A }, { b: B, <<: *a1 } ]\n')
    })

    test('merge pair of an alias', () => {
      const doc = parseDocument<YAMLSeq<YAMLMap>>('[{ a: A }, { b: B }]', {
        merge: true
      })
      const [a, b] = doc.value
      const alias = doc.createAlias(a, 'AA')
      const merge = doc.createMergePair(alias)
      b.set(merge)
      expect(doc.toJS()).toMatchObject([{ a: 'A' }, { a: 'A', b: 'B' }])
      expect(() => doc.toJS({ maxAliasCount: 0 })).toThrow(ReferenceError)
      expect(String(doc)).toBe('[ &AA { a: A }, { b: B, <<: *AA } ]\n')
    })

    test('merge pair of an alias to a sequence', () => {
      const doc = parseDocument<YAMLSeq>('[{ a: A }, [], { b: B }]', {
        merge: true
      })
      const a = doc.get(0) as YAMLMap
      const seq = doc.get(1) as YAMLSeq
      const b = doc.get(2) as YAMLMap
      seq.anchor = 'SEQ'
      seq.push(doc.createAlias(a, 'AA'))
      b.set(doc.createMergePair(doc.createAlias(seq)))

      expect(doc.toJS()).toMatchObject([
        { a: 'A' },
        [{ a: 'A' }],
        { a: 'A', b: 'B' }
      ])
      expect(() => doc.toJS({ maxAliasCount: 0 })).toThrow(ReferenceError)
      expect(String(doc)).toBe(
        '[ &AA { a: A }, &SEQ [ *AA ], { b: B, <<: *SEQ } ]\n'
      )
    })

    test('require map node', () => {
      const doc = parseDocument<YAMLSeq<YAMLMap<any, any>>>(
        '[{ a: A }, { b: B }]',
        {
          merge: true
        }
      )
      const alias = doc.createAlias(doc.get(0)!.get('a'))
      doc.get(1)!.set(doc.createMergePair(alias))
      expect(String(doc)).toBe('[ { a: &a1 A }, { b: B, <<: *a1 } ]\n')
      expect(() => doc.toJS()).toThrow(
        'Merge sources must be maps or map aliases'
      )
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

    const expMap = new Map<string, unknown>([
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
      const res = parse(srcKeys, { merge: true })
      expect(res).toEqual(expObj)
    })

    test('multiple merge keys, masAsMap: true', () => {
      const res = parse(srcKeys, { merge: true, mapAsMap: true })
      expect(res).toEqual(expMap)
    })

    test('sequence of anchors, masAsMap: false', () => {
      const res = parse(srcSeq, { merge: true })
      expect(res).toEqual(expObj)
    })

    test('sequence of anchors, masAsMap: true', () => {
      const res = parse(srcSeq, { merge: true, mapAsMap: true })
      expect(res).toEqual(expMap)
    })
  })

  test('do not throw error when key is null', () => {
    const src = ': 123'
    expect(() => parse(src, { merge: true })).not.toThrow()
  })

  test('merge with circular reference', () => {
    const src = '- &a { a: *a, b: B }\n- { <<: *a, b: X }\n'
    const res = parse(src, { merge: true })
    expect(res[1].a instanceof Map).toBe(false)
    expect(res).toEqual([
      { a: res[0], b: 'B' },
      { a: res[0], b: 'X' }
    ])
  })

  describe('parse errors', () => {
    test('non-alias merge value', () => {
      const src = '{ <<: A, B: b }'
      expect(() => parse(src, { merge: true })).toThrow(
        'Merge sources must be maps or map aliases'
      )
    })

    test('non-map alias', () => {
      const src = '- &A a\n- { <<: *A, B: b }'
      expect(() => parse(src, { merge: true })).toThrow(
        'Merge sources must be maps or map aliases'
      )
    })

    test('immediate non-map merge value', () => {
      const src = '{ <<: [ [42] ], a: A }'
      expect(() => parse(src, { merge: true })).toThrow(
        'Merge sources must be maps or map aliases'
      )
    })

    test('missing whitespace', () => {
      expect(() => parse('&a{}')).toThrow(
        'Tags and anchors must be separated from the next token by white space'
      )
    })
  })

  describe('stringify', () => {
    test('example', () => {
      const doc = parseDocument(src, { merge: true })
      expect(parse(String(doc), { merge: true })).toMatchObject([
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
