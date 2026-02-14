import {
  Document,
  Pair,
  Scalar,
  YAMLMap,
  type YAMLOMap,
  YAMLSeq,
  type YAMLSet,
  parseDocument
} from 'yaml'

describe('Map', () => {
  let doc: Document
  let map: YAMLMap<string, number | string | YAMLMap<string, number>>
  beforeEach(() => {
    doc = new Document({ a: 1, b: { c: 3, d: 4 } })
    map = doc.value as any
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
    map.add(doc.createPair('c', 'x'))
    expect(map.get('c')).toMatchObject({ value: 'x' })
    map.add(doc.createPair('c', 'y'))
    expect(map.get('c')).toMatchObject({ value: 'y' })
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
    expect(map.get('a')).toMatchObject({ value: 1 })
    const subMap = map.get('b')
    expect(subMap).toBeInstanceOf(YAMLMap)
    expect(subMap!.toJS(doc)).toMatchObject({
      c: 3,
      d: 4
    })
    expect(map.get('c')).toBeUndefined()
  })

  test('get with node', () => {
    expect(map.get(doc.createNode('a'))).toMatchObject({ value: 1 })
    const subMap = map.get(doc.createNode('b'))
    expect(subMap).toBeInstanceOf(YAMLMap)
    expect(subMap!.toJS(doc)).toMatchObject({ c: 3, d: 4 })
    expect(map.get(doc.createNode('c'))).toBeUndefined()
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
    expect(map.get('a')).toMatchObject({ value: 2 })
    map.set('b', 5)
    expect(map.get('b')).toMatchObject({ value: 5 })
    map.set('c', 6)
    expect(map.get('c')).toMatchObject({ value: 6 })
    expect(map.items).toHaveLength(3)
  })

  test('set with node', () => {
    map.set(doc.createNode('a'), 2)
    expect(map.get('a')).toMatchObject({ value: 2 })
    map.set(doc.createNode('b'), 5)
    expect(map.get('b')).toMatchObject({ value: 5 })
    map.set(doc.createNode('c'), 6)
    expect(map.get('c')).toMatchObject({ value: 6 })
    expect(map.items).toHaveLength(3)
  })

  test('set scalar node with anchor', () => {
    doc = parseDocument('a: &A value\nb: *A\n')
    doc.set('a', 'foo')
    expect(doc.get('a')).toMatchObject({ value: 'foo' })
    expect(String(doc)).toBe('a: &A foo\nb: *A\n')
  })
})

describe('Seq', () => {
  let doc: Document
  let seq: YAMLSeq<number | Scalar<number> | YAMLSeq<number | Scalar<number>>>
  beforeEach(() => {
    doc = new Document([1, [2, 3]])
    seq = doc.value as any
    expect(seq.items).toMatchObject([
      { value: 1 },
      { items: [{ value: 2 }, { value: 3 }] }
    ])
  })

  test('add', () => {
    seq.add(9)
    expect(seq.get(2)).toMatchObject({ value: 9 })
    seq.add(1)
    expect(seq.items).toHaveLength(4)
  })

  test('delete', () => {
    expect(seq.delete(0)).toBe(true)
    expect(seq.delete(2)).toBe(false)
    expect(() => seq.delete('a' as any)).toThrow(TypeError)
    expect(seq.get(0)).toMatchObject({ items: [{ value: 2 }, { value: 3 }] })
    expect(seq.items).toHaveLength(1)
  })

  test('get with integer', () => {
    expect(seq.get(0)).toMatchObject({ value: 1 })
    const subSeq = seq.get(1)
    expect(subSeq).toBeInstanceOf(YAMLSeq)
    expect(subSeq!.toJS(doc)).toMatchObject([2, 3])
    expect(seq.get(2)).toBeUndefined()
  })

  test('get with non-integer', () => {
    expect(() => seq.get(-1)).toThrow(RangeError)
    expect(() => seq.get(0.5)).toThrow(TypeError)
    expect(() => seq.get('0' as any)).toThrow(TypeError)
    expect(() => seq.get(doc.createNode(0) as any)).toThrow(TypeError)
  })

  test('has with integer', () => {
    expect(seq.has(0)).toBe(true)
    expect(seq.has(1)).toBe(true)
    expect(seq.has(2)).toBe(false)
  })

  test('has with non-integer', () => {
    expect(() => seq.has(-1)).toThrow(RangeError)
    expect(() => seq.has(0.5)).toThrow(TypeError)
    expect(() => seq.has('0' as any)).toThrow(TypeError)
    // @ts-expect-error TS complains, as it should.
    expect(() => seq.has()).toThrow(TypeError)
    expect(() => seq.has(doc.createNode(0) as any)).toThrow(TypeError)
  })

  test('set with integer', () => {
    seq.set(0, 2)
    expect(seq.get(0)).toMatchObject({ value: 2 })
    seq.set(1, 5)
    expect(seq.get(1)).toMatchObject({ value: 5 })
    seq.set(2, 6)
    expect(seq.get(2)).toMatchObject({ value: 6 })
    expect(seq.items).toHaveLength(3)
  })

  test('set with non-integer', () => {
    expect(() => seq.set(-1, 2)).toThrow(RangeError)
    expect(() => seq.set(0.5, 2)).toThrow(TypeError)
    expect(() => seq.set(doc.createNode(0) as any, 2)).toThrow(TypeError)
  })
})

describe('Set', () => {
  let doc: Document
  let set: YAMLSet<number | string>
  beforeEach(() => {
    doc = new Document(null, { version: '1.1' })
    set = doc.createNode([1, 2, 3], { tag: '!!set' }) as any
    doc.value = set
    expect(set.items).toMatchObject([
      { key: { value: 1 }, value: null },
      { key: { value: 2 }, value: null },
      { key: { value: 3 }, value: null }
    ])
  })

  test('add', () => {
    set.add('x')
    expect(set.get('x')).toMatchObject({ value: 'x' })
    set.add('x')
    const y0 = new Scalar('y')
    set.add(new Pair(y0))
    set.add(new Pair(new Scalar('y')))
    expect(set.get('y')).toBe(y0)
    expect(set.items).toHaveLength(5)
  })

  test('get', () => {
    expect(set.get(1)).toMatchObject({ value: 1 })
    expect(set.get(0)).toBeUndefined()
    expect(set.get('1')).toBeUndefined()
  })

  test('set', () => {
    set.set(1, true)
    expect(set.get(1)).toMatchObject({ value: 1 })
    set.set(1, false)
    expect(set.get(1)).toBeUndefined()
    set.set(4, false)
    expect(set.get(4)).toBeUndefined()
    set.set(4, true)
    expect(set.get(4)).toMatchObject(new Scalar(4))
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
    doc.value = omap
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
    omap.add(doc.createPair('c', 'x'))
    expect(omap.get('c')).toMatchObject({ value: 'x' })
    omap.add(doc.createPair('c', 'y'))
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
    expect(omap.get('a')).toMatchObject({ value: 1 })
    const subMap = omap.get('b')
    expect(subMap).toBeInstanceOf(YAMLMap)
    expect(subMap.toJS(doc)).toMatchObject({ c: 3, d: 4 })
    expect(omap.get('c')).toBeUndefined()
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
    expect(omap.get('a')).toMatchObject({ value: 2 })
    omap.set('b', 5)
    expect(omap.get('b')).toMatchObject({ value: 5 })
    omap.set('c', 6)
    expect(omap.get('c')).toMatchObject({ value: 6 })
    expect(omap.items).toHaveLength(3)
  })
})

describe('Document', () => {
  let doc: Document<YAMLMap<string, Scalar<number> | YAMLSeq<Scalar<number>>>>
  beforeEach(() => {
    doc = new Document({ a: 1, b: [2, 3] })
    expect(doc.value.items).toMatchObject([
      { key: { value: 'a' }, value: { value: 1 } },
      {
        key: { value: 'b' },
        value: { items: [{ value: 2 }, { value: 3 }] }
      }
    ])
  })

  test('add', () => {
    doc.add(doc.createPair('c', 'x'))
    expect(doc.get('c')).toMatchObject({ value: 'x' })
    expect(doc.value.items).toHaveLength(3)
  })

  test('delete', () => {
    expect(doc.delete('a')).toBe(true)
    expect(doc.delete('a')).toBe(false)
    expect(doc.get('a')).toBeUndefined()
    expect(doc.value.items).toHaveLength(1)
  })

  test('delete on scalar value', () => {
    const doc = new Document('s')
    expect(() => doc.set('a', 1)).toThrow(/document value/)
  })

  test('get', () => {
    expect(doc.get('a')).toMatchObject({ value: 1 })
    expect(doc.get('c')).toBeUndefined()
  })

  test('get on scalar value', () => {
    const doc = new Document('s')
    expect(doc.get('a')).toBeUndefined()
  })

  test('has', () => {
    expect(doc.has('a')).toBe(true)
    expect(doc.has('c')).toBe(false)
  })

  test('has on scalar value', () => {
    const doc = new Document('s')
    expect(doc.has('a')).toBe(false)
  })

  test('set', () => {
    doc.set('a', 2)
    expect(doc.get('a')).toMatchObject({ value: 2 })
    doc.set('c', 6)
    expect(doc.get('c')).toMatchObject({ value: 6 })
    expect(doc.value.items).toHaveLength(3)
  })

  test('set on scalar value', () => {
    const doc = new Document('s')
    expect(() => doc.set('a', 1)).toThrow(/document value/)
  })
})
