import {
  Document,
  parseDocument,
  Pair,
  Scalar,
  YAMLMap,
  YAMLOMap,
  YAMLSeq,
  YAMLSet,
  isSeq,
  isMap
} from 'yaml'

describe('Map', () => {
  let doc: Document
  let map: YAMLMap<
    string | Scalar<string>,
    | number
    | string
    | Scalar<number | string>
    | YAMLMap<string | Scalar<string>, number | Scalar<number>>
  >
  beforeEach(() => {
    doc = new Document({ a: 1, b: { c: 3, d: 4 } })
    map = doc.contents as any
    expect(map.items).toMatchObject([
      { key: { value: 'a' }, value: { value: 1 } },
      {
        key: { value: 'b' },
        value: {
          items: [
            { key: { value: 'c' }, value: { value: 3 } },
            { key: { value: 'd' }, value: { value: 4 } }
          ]
        }
      }
    ])
  })

  test('add', () => {
    map.add({ key: 'c', value: 'x' })
    expect(map.get('c')).toBe('x')
    // @ts-expect-error TS should complain here
    expect(() => map.add('a')).toThrow(/already set/)
    expect(() => map.add(new Pair('c', 'y'))).toThrow(/already set/)
    expect(map.items).toHaveLength(3)
  })

  test('delete', () => {
    expect(map.delete('a')).toBe(true)
    expect(map.get('a')).toBeUndefined()
    expect(map.delete('c')).toBe(false)
    expect(map.get('b')).toMatchObject({ items: [{}, {}] })
    expect(map.items).toHaveLength(1)
  })

  test('get with value', () => {
    expect(map.get('a')).toBe(1)
    expect(map.get('a', true)).toMatchObject({ value: 1 })
    const subMap = map.get('b')
    if (isMap<string, number>(subMap)) {
      expect(subMap.toJSON()).toMatchObject({
        c: 3,
        d: 4
      })
      expect(map.get('c')).toBeUndefined()
    } else {
      throw new Error('Expected subMap to be a Map')
    }
  })

  test('get with node', () => {
    expect(map.get(doc.createNode('a'))).toBe(1)
    expect(map.get(doc.createNode('a'), true)).toMatchObject({ value: 1 })
    const subMap = map.get(doc.createNode('b'))
    if (isMap<string, number>(subMap)) {
      expect(subMap.toJSON()).toMatchObject({ c: 3, d: 4 })
      expect(map.get(doc.createNode('c'))).toBeUndefined()
    } else {
      throw new Error('Expected subMap to be a Map')
    }
  })

  test('has with value', () => {
    expect(map.has('a')).toBe(true)
    expect(map.has('b')).toBe(true)
    expect(map.has('c')).toBe(false)
    expect(map.has('')).toBe(false)
    // @ts-expect-error TS should complain here
    expect(map.has()).toBe(false)
  })

  test('has with node', () => {
    expect(map.has(doc.createNode('a'))).toBe(true)
    expect(map.has(doc.createNode('b'))).toBe(true)
    expect(map.has(doc.createNode('c'))).toBe(false)
    // @ts-expect-error TS should complain here
    expect(map.has(doc.createNode())).toBe(false)
  })

  test('set with value', () => {
    map.set('a', 2)
    expect(map.get('a')).toBe(2)
    expect(map.get('a', true)).toMatchObject({ value: 2 })
    map.set('b', 5)
    expect(map.get('b')).toBe(5)
    map.set('c', 6)
    expect(map.get('c')).toBe(6)
    expect(map.items).toHaveLength(3)
  })

  test('set with node', () => {
    map.set(doc.createNode('a'), 2)
    expect(map.get('a')).toBe(2)
    expect(map.get('a', true)).toMatchObject({ value: 2 })
    map.set(doc.createNode('b'), 5)
    expect(map.get('b')).toBe(5)
    map.set(doc.createNode('c'), 6)
    expect(map.get('c')).toBe(6)
    expect(map.items).toHaveLength(3)
  })

  test('set scalar node with anchor', () => {
    doc = parseDocument('a: &A value\nb: *A\n')
    doc.set('a', 'foo')
    expect(doc.get('a', true)).toMatchObject({ value: 'foo' })
    expect(String(doc)).toBe('a: &A foo\nb: *A\n')
  })
})

describe('Seq', () => {
  let doc: Document
  let seq: YAMLSeq<number | Scalar<number> | YAMLSeq<number | Scalar<number>>>
  beforeEach(() => {
    doc = new Document([1, [2, 3]])
    seq = doc.contents as any
    expect(seq.items).toMatchObject([
      { value: 1 },
      { items: [{ value: 2 }, { value: 3 }] }
    ])
  })

  test('add', () => {
    seq.add(9)
    expect(seq.get(2)).toBe(9)
    seq.add(1)
    expect(seq.items).toHaveLength(4)
  })

  test('delete', () => {
    expect(seq.delete(0)).toBe(true)
    expect(seq.delete(2)).toBe(false)
    expect(seq.delete('a')).toBe(false)
    expect(seq.get(0)).toMatchObject({ items: [{ value: 2 }, { value: 3 }] })
    expect(seq.items).toHaveLength(1)
  })

  test('get with value', () => {
    expect(seq.get(0)).toBe(1)
    expect(seq.get('0')).toBe(1)
    expect(seq.get(0, true)).toMatchObject({ value: 1 })
    const subSeq = seq.get(1)
    if (isSeq<number>(subSeq)) {
      expect(subSeq.toJSON()).toMatchObject([2, 3])
      expect(seq.get(2)).toBeUndefined()
    } else {
      throw new Error('not a seq')
    }
  })

  test('get with node', () => {
    expect(seq.get(doc.createNode(0))).toBe(1)
    expect(seq.get(doc.createNode('0'))).toBe(1)
    expect(seq.get(doc.createNode(0), true)).toMatchObject({ value: 1 })
    const subSeq = seq.get(doc.createNode(1))
    if (isSeq<number>(subSeq)) {
      expect(subSeq.toJSON()).toMatchObject([2, 3])
      expect(seq.get(doc.createNode(2))).toBeUndefined()
    } else {
      throw new Error('not a seq')
    }
  })

  test('has with value', () => {
    expect(seq.has(0)).toBe(true)
    expect(seq.has(1)).toBe(true)
    expect(seq.has(2)).toBe(false)
    expect(seq.has('0')).toBe(true)
    expect(seq.has('')).toBe(false)
    // @ts-expect-error TS should complain here
    expect(seq.has()).toBe(false)
  })

  test('has with node', () => {
    expect(seq.has(doc.createNode(0))).toBe(true)
    expect(seq.has(doc.createNode('0'))).toBe(true)
    expect(seq.has(doc.createNode(2))).toBe(false)
    expect(seq.has(doc.createNode(''))).toBe(false)
    // @ts-expect-error TS should complain here
    expect(seq.has(doc.createNode())).toBe(false)
  })

  test('set with value', () => {
    seq.set(0, 2)
    expect(seq.get(0)).toBe(2)
    expect(seq.get(0, true)).toMatchObject({ value: 2 })
    seq.set('1', 5)
    expect(seq.get(1)).toBe(5)
    seq.set(2, 6)
    expect(seq.get(2)).toBe(6)
    expect(seq.items).toHaveLength(3)
  })

  test('set with node', () => {
    seq.set(doc.createNode(0), 2)
    expect(seq.get(0)).toBe(2)
    expect(seq.get(0, true)).toMatchObject({ value: 2 })
    seq.set(doc.createNode('1'), 5)
    expect(seq.get(1)).toBe(5)
    seq.set(doc.createNode(2), 6)
    expect(seq.get(2)).toBe(6)
    expect(seq.items).toHaveLength(3)
  })
})

describe('Set', () => {
  let doc: Document
  let set: YAMLSet<number | string | Scalar<number> | Pair>
  beforeEach(() => {
    doc = new Document(null, { version: '1.1' })
    set = doc.createNode([1, 2, 3], { tag: '!!set' }) as any
    doc.contents = set
    expect(set.items).toMatchObject([
      { key: { value: 1 }, value: { value: null } },
      { key: { value: 2 }, value: { value: null } },
      { key: { value: 3 }, value: { value: null } }
    ])
  })

  test('add', () => {
    set.add('x')
    expect(set.get('x')).toBe('x')
    set.add('x')
    const y0 = new Pair('y')
    set.add(y0)
    set.add(new Pair('y'))
    expect(set.get('y', true)).toBe(y0)
    expect(set.items).toHaveLength(5)
  })

  test('get', () => {
    expect(set.get(1)).toBe(1)
    expect(set.get(1, true)).toMatchObject({
      key: { value: 1 },
      value: { value: null }
    })
    expect(set.get(0)).toBeUndefined()
    expect(set.get('1')).toBeUndefined()
  })

  test('set', () => {
    set.set(1, true)
    expect(set.get(1)).toBe(1)
    set.set(1, false)
    expect(set.get(1)).toBeUndefined()
    set.set(4, false)
    expect(set.get(4)).toBeUndefined()
    set.set(4, true)
    expect(set.get(4)).toBe(4)
    expect(set.get(4, true)).toMatchObject({ key: 4, value: null })
    expect(set.items).toHaveLength(3)
  })
})

describe('OMap', () => {
  let doc: Document
  let omap: YAMLOMap
  beforeEach(() => {
    doc = new Document(null, { version: '1.1' })
    omap = doc.createNode([{ a: 1 }, { b: { c: 3, d: 4 } }], {
      tag: '!!omap'
    }) as any
    doc.contents = omap
    expect(omap.items).toMatchObject([
      { key: { value: 'a' }, value: { value: 1 } },
      {
        key: { value: 'b' },
        value: {
          items: [
            { key: { value: 'c' }, value: { value: 3 } },
            { key: { value: 'd' }, value: { value: 4 } }
          ]
        }
      }
    ])
  })

  test('add', () => {
    omap.add({ key: 'c', value: 'x' })
    expect(omap.get('c')).toBe('x')
    // @ts-expect-error TS should complain here
    expect(() => omap.add('a')).toThrow(/already set/)
    expect(() => omap.add(new Pair('c', 'y'))).toThrow(/already set/)
    expect(omap.items).toHaveLength(3)
  })

  test('delete', () => {
    expect(omap.delete('a')).toBe(true)
    expect(omap.get('a')).toBeUndefined()
    expect(omap.delete('c')).toBe(false)
    expect(omap.get('b')).toMatchObject({ items: [{}, {}] })
    expect(omap.items).toHaveLength(1)
  })

  test('get', () => {
    expect(omap.get('a')).toBe(1)
    expect(omap.get('a', true)).toMatchObject({ value: 1 })
    const subMap = omap.get('b')
    if (isMap(subMap)) {
      expect(subMap.toJSON()).toMatchObject({ c: 3, d: 4 })
      expect(omap.get('c')).toBeUndefined()
    } else {
      throw new Error('Expected subMap to be a map')
    }
  })

  test('has', () => {
    expect(omap.has('a')).toBe(true)
    expect(omap.has('b')).toBe(true)
    expect(omap.has('c')).toBe(false)
    expect(omap.has('')).toBe(false)
    // @ts-expect-error TS should complain here
    expect(omap.has()).toBe(false)
  })

  test('set', () => {
    omap.set('a', 2)
    expect(omap.get('a')).toBe(2)
    expect(omap.get('a', true)).toMatchObject({ value: 2 })
    omap.set('b', 5)
    expect(omap.get('b')).toBe(5)
    omap.set('c', 6)
    expect(omap.get('c')).toBe(6)
    expect(omap.items).toHaveLength(3)
  })
})

describe('Collection', () => {
  let doc: Document
  let map: YAMLMap<string, Scalar<number> | YAMLSeq<Scalar<number>>>
  beforeEach(() => {
    doc = new Document({ a: 1, b: [2, 3] })
    map = doc.contents as any
  })

  test('addIn', () => {
    map.addIn(['b'], 4)
    expect(map.getIn(['b', 2])).toBe(4)
    map.addIn([], new Pair('c', 5))
    expect(map.get('c')).toBe(5)
    expect(() => map.addIn(['a'], -1)).toThrow(/Expected YAML collection/)
    map.addIn(['b', 3], 6)
    expect(map.items).toHaveLength(3)
    const seq = map.getIn(['b'])
    if (isSeq(seq)) {
      expect(seq.items).toHaveLength(4)
    } else {
      throw new Error('Expected seq to be a seq')
    }
  })

  test('deleteIn', () => {
    expect(map.deleteIn(['a'])).toBe(true)
    expect(map.get('a')).toBeUndefined()
    expect(map.deleteIn(['b', 1])).toBe(true)
    expect(map.getIn(['b', 1])).toBeUndefined()
    expect(map.deleteIn([1])).toBe(false)
    expect(map.deleteIn(['b', 2])).toBe(false)
    expect(() => map.deleteIn(['a', 'e'])).toThrow(/Expected YAML collection/)
    expect(map.items).toHaveLength(1)
    const subSeq = map.getIn(['b'])
    if (isSeq(subSeq)) {
      expect(subSeq.items).toHaveLength(1)
    } else {
      throw new Error('Expected subSeq to be a seq')
    }
  })

  test('getIn', () => {
    expect(map.getIn(['a'])).toBe(1)
    expect(map.getIn(['a'], true)).toMatchObject({ value: 1 })
    expect(map.getIn(['b', 1])).toBe(3)
    expect(map.getIn(['b', '1'])).toBe(3)
    expect(map.getIn(['b', 1], true)).toMatchObject({ value: 3 })
    expect(map.getIn(['b', 2])).toBeUndefined()
    expect(map.getIn(['c', 'e'])).toBeUndefined()
    expect(map.getIn(['a', 'e'])).toBeUndefined()
  })

  test('hasIn', () => {
    expect(map.hasIn(['a'])).toBe(true)
    expect(map.hasIn(['b', 1])).toBe(true)
    expect(map.hasIn(['b', '1'])).toBe(true)
    expect(map.hasIn(['b', 2])).toBe(false)
    expect(map.hasIn(['c', 'e'])).toBe(false)
    expect(map.hasIn(['a', 'e'])).toBe(false)
  })

  test('setIn', () => {
    map.setIn(['a'], 2)
    expect(map.get('a')).toBe(2)
    expect(map.get('a', true)).toMatchObject({ value: 2 })
    map.setIn(['b', 1], 5)
    expect(map.getIn(['b', 1])).toBe(5)
    map.setIn([1], 6)
    expect(map.get(1)).toBe(6)
    map.setIn(['b', 2], 6)
    expect(map.getIn(['b', 2])).toBe(6)
    map.setIn(['e', 'e'], 7)
    expect(map.getIn(['e', 'e'])).toBe(7)
    expect(() => map.setIn(['a', 'e'], 8)).toThrow(/Expected YAML collection/)
    expect(map.items).toHaveLength(4)
    const subSeq = map.getIn(['b'])
    if (isSeq(subSeq)) {
      expect(subSeq.items).toHaveLength(3)
    } else {
      throw new Error('Expected subSeq to be a seq')
    }
  })
})

describe('Document', () => {
  let doc: Document<YAMLMap<string, Scalar<number> | YAMLSeq<Scalar<number>>>>
  beforeEach(() => {
    doc = new Document({ a: 1, b: [2, 3] })
    expect(doc.contents?.items).toMatchObject([
      { key: { value: 'a' }, value: { value: 1 } },
      {
        key: { value: 'b' },
        value: { items: [{ value: 2 }, { value: 3 }] }
      }
    ])
  })

  test('add', () => {
    doc.add({ key: 'c', value: 'x' })
    expect(doc.get('c')).toBe('x')
    expect(() => doc.add('a')).toThrow(/already set/)
    expect(() => doc.add(new Pair('c', 'y'))).toThrow(/already set/)
    expect(doc.contents?.items).toHaveLength(3)
  })

  test('addIn', () => {
    doc.addIn(['b'], 4)
    expect(doc.getIn(['b', 2])).toBe(4)
    doc.addIn([], new Pair('c', 5))
    expect(doc.get('c')).toBe(5)
    expect(() => doc.addIn(['a'], -1)).toThrow(/Expected YAML collection/)
    doc.addIn(['b', 3], 6)
    expect(doc.contents?.items).toHaveLength(3)
    expect((doc.get('b') as any).items).toHaveLength(4)
  })

  test('delete', () => {
    expect(doc.delete('a')).toBe(true)
    expect(doc.delete('a')).toBe(false)
    expect(doc.get('a')).toBeUndefined()
    expect(doc.contents?.items).toHaveLength(1)
  })

  test('delete on scalar contents', () => {
    const doc = new Document('s')
    expect(() => doc.set('a', 1)).toThrow(/document contents/)
  })

  test('deleteIn', () => {
    expect(doc.deleteIn(['a'])).toBe(true)
    expect(doc.get('a')).toBeUndefined()
    expect(doc.deleteIn(['b', 1])).toBe(true)
    expect(doc.getIn(['b', 1])).toBeUndefined()
    expect(doc.deleteIn([1])).toBe(false)
    expect(doc.deleteIn(['b', 2])).toBe(false)
    expect(() => doc.deleteIn(['a', 'e'])).toThrow(/Expected/)
    expect(doc.contents?.items).toHaveLength(1)
    expect((doc.get('b') as any).items).toHaveLength(1)
    expect(doc.deleteIn(null)).toBe(true)
    expect(doc.deleteIn(null)).toBe(false)
  })

  test('get', () => {
    expect(doc.get('a')).toBe(1)
    expect(doc.get('a', true)).toMatchObject({ value: 1 })
    expect(doc.get('c')).toBeUndefined()
  })

  test('get on scalar contents', () => {
    const doc = new Document('s')
    expect(doc.get('a')).toBeUndefined()
  })

  test('getIn collection', () => {
    expect(doc.getIn(['a'])).toBe(1)
    expect(doc.getIn(['a'], true)).toMatchObject({ value: 1 })
    expect(doc.getIn(['b', 1])).toBe(3)
    expect(doc.getIn(['b', 1], true)).toMatchObject({ value: 3 })
    expect(doc.getIn(['b', 'e'])).toBeUndefined()
    expect(doc.getIn(['c', 'e'])).toBeUndefined()
    expect(doc.getIn(['a', 'e'])).toBeUndefined()
  })

  test('getIn scalar', () => {
    const doc = new Document('s')
    expect(doc.getIn([])).toBe('s')
    expect(doc.getIn(null, true)).toMatchObject({ value: 's' })
    expect(doc.getIn([0])).toBeUndefined()
  })

  test('has', () => {
    expect(doc.has('a')).toBe(true)
    expect(doc.has('c')).toBe(false)
  })

  test('has on scalar contents', () => {
    const doc = new Document('s')
    expect(doc.has('a')).toBe(false)
  })

  test('hasIn', () => {
    expect(doc.hasIn(['a'])).toBe(true)
    expect(doc.hasIn(['b', 1])).toBe(true)
    expect(doc.hasIn(['b', 'e'])).toBe(false)
    expect(doc.hasIn(['c', 'e'])).toBe(false)
    expect(doc.hasIn(['a', 'e'])).toBe(false)
  })

  test('set', () => {
    doc.set('a', 2)
    expect(doc.get('a')).toBe(2)
    expect(doc.get('a', true)).toMatchObject({ value: 2 })
    doc.set('c', 6)
    expect(doc.get('c')).toBe(6)
    expect(doc.contents?.items).toHaveLength(3)
  })

  test('set on scalar contents', () => {
    const doc = new Document('s')
    expect(() => doc.set('a', 1)).toThrow(/document contents/)
  })

  test('set on empty document', () => {
    doc.contents = null
    doc.set('a', 1)
    expect(doc.get('a')).toBe(1)
  })

  test('setIn', () => {
    doc.setIn(['a'], 2)
    expect(doc.getIn(['a'])).toBe(2)
    expect(doc.getIn(['a'], true)).toMatchObject({ value: 2 })
    doc.setIn(['b', 1], 5)
    expect(doc.getIn(['b', 1])).toBe(5)
    doc.setIn(['c'], 6)
    expect(doc.getIn(['c'])).toBe(6)
    doc.setIn(['e', 1, 'e'], 7)
    expect(doc.getIn(['e', 1, 'e'])).toBe(7)
    expect(() => doc.setIn(['a', 'e'], 8)).toThrow(/Expected YAML collection/)
    expect(doc.contents?.items).toHaveLength(4)
    expect((doc.get('b') as any).items).toHaveLength(2)
    expect(String(doc)).toBe(
      'a: 2\nb:\n  - 2\n  - 5\nc: 6\ne:\n  - null\n  - e: 7\n'
    )
  })

  test('setIn on scalar contents', () => {
    const doc = new Document('s')
    expect(() => doc.setIn(['a'], 1)).toThrow(/document contents/)
  })

  test('setIn on empty document', () => {
    doc.contents = null
    doc.setIn(['a', 2], 1)
    expect(doc.get('a')).toMatchObject({
      items: [{ value: null }, { value: null }, { value: 1 }]
    })
  })

  test('setIn on parsed document', () => {
    const doc = parseDocument('{ a: 1, b: [2, 3] }')
    doc.setIn(['c', 1], 9)
    expect(String(doc)).toBe('{ a: 1, b: [ 2, 3 ], c: [ null, 9 ] }\n')
  })

  test('setIn with __proto__ as key', () => {
    doc.setIn(['c', '__proto__'], 9)
    expect(String(doc)).toBe('a: 1\nb:\n  - 2\n  - 3\nc:\n  __proto__: 9\n')
  })

  test('setIn with object key', () => {
    doc.contents = null
    const foo = { foo: 'FOO' }
    doc.setIn([foo], 'BAR')
    // @ts-expect-error - Doesn't see that setIn() changes contents
    expect(doc.contents?.items).toMatchObject([
      {
        key: { items: [{ key: { value: 'foo' }, value: { value: 'FOO' } }] },
        value: { value: 'BAR' }
      }
    ])
  })

  test('setIn with repeated object key', () => {
    doc.contents = null
    const foo = { foo: 'FOO' }
    doc.setIn([foo, foo], 'BAR')
    // @ts-expect-error - Doesn't see that setIn() changes contents
    expect(doc.contents?.items).toMatchObject([
      {
        key: { items: [{ key: { value: 'foo' }, value: { value: 'FOO' } }] },
        value: {
          items: [
            {
              key: {
                items: [{ key: { value: 'foo' }, value: { value: 'FOO' } }]
              },
              value: { value: 'BAR' }
            }
          ]
        }
      }
    ])
  })
})
