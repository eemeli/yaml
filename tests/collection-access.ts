import {
  Document,
  Scalar,
  YAMLMap,
  type YAMLOMap,
  YAMLSeq,
  type YAMLSet,
  parseDocument
} from 'yaml'
import { _map, _pair, _seq, _set } from './_utils.ts'

describe('Map', () => {
  let doc: Document
  let map: YAMLMap<string, number | string | YAMLMap<string, number>>
  beforeEach(() => {
    doc = new Document({ a: 1, b: { c: 3, d: 4 } })
    map = doc.value as any
  })

  test('create', () => {
    expect(map).toMatchObject(_map({ a: 1, b: _map({ c: 3, d: 4 }) }))
  })

  test('set', () => {
    map.set(doc.createPair('c', 'x'))
    expect(map.get('c')).toMatchObject({ value: 'x' })
    map.set('c', 'y')
    expect(map.get('c')).toMatchObject({ value: 'y' })
    expect(map.size).toBe(3)
  })

  test('delete', () => {
    expect(map.delete('a')).toBe(true)
    expect(map.get('a')).toBeUndefined()
    expect(map.delete('c')).toBe(false)
    expect(map.get('b')).toMatchObject({ size: 2 })
    expect(map.size).toBe(1)
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
    expect(map.size).toBe(3)
  })

  test('set with node', () => {
    map.set(doc.createNode('a'), 2)
    expect(map.get('a')).toMatchObject({ value: 2 })
    map.set(doc.createNode('b'), 5)
    expect(map.get('b')).toMatchObject({ value: 5 })
    map.set(doc.createNode('c'), 6)
    expect(map.get('c')).toMatchObject({ value: 6 })
    expect(map.size).toBe(3)
  })

  test('set scalar node with anchor', () => {
    const doc = parseDocument('a: &A value\nb: *A\n')
    doc.set('a', 'foo')
    expect(doc.get('a')).toMatchObject({ value: 'foo' })
    expect(String(doc)).toBe('a: &A foo\nb: *A\n')
  })

  test('object key equality', () => {
    const a1 = [1]
    const doc = new Document<YAMLMap>(
      new Map<any, any>([
        [1, 2],
        ['1', '2'],
        [a1, [2]]
      ])
    )
    expect(doc.get(1)).toMatchObject({ value: 2 })
    expect(doc.get('1')).toMatchObject({ value: '2' })
    expect(doc.get([1])).toBeUndefined()
    expect(doc.get(a1)).toMatchObject([{ value: 2 }])
  })
})

describe('Seq', () => {
  let doc: Document
  let seq: YAMLSeq<number | Scalar<number> | YAMLSeq<number | Scalar<number>>>
  beforeEach(() => {
    doc = new Document([1, [2, 3]])
    seq = doc.value as any
  })

  test('create', () => {
    expect(seq).toMatchObject([{ value: 1 }, [{ value: 2 }, { value: 3 }]])
  })

  test('push', () => {
    seq.push(9)
    expect(seq[2]).toMatchObject({ value: 9 })
    seq.push(1)
    expect(seq).toHaveLength(4)
  })

  test('index access', () => {
    expect(seq[0]).toMatchObject({ value: 1 })
    const subSeq = seq[1]
    expect(subSeq).toBeInstanceOf(YAMLSeq)
    expect(subSeq.toJS(doc)).toMatchObject([2, 3])
    expect(seq[2]).toBeUndefined()
  })

  test('at() with integer', () => {
    expect(seq.at(0)).toMatchObject({ value: 1 })
    const subSeq = seq.at(1)
    expect(subSeq).toBeInstanceOf(YAMLSeq)
    expect(subSeq!.toJS(doc)).toMatchObject([2, 3])
    expect(seq.at(2)).toBeUndefined()
  })

  test('set with integer', () => {
    seq.set(0, 2)
    expect(seq.at(0)).toMatchObject({ value: 2 })
    seq.set(-1, 5)
    expect(seq.at(1)).toMatchObject({ value: 5 })
    seq.set(2, 6)
    expect(seq.at(2)).toMatchObject({ value: 6 })
    expect(seq).toHaveLength(3)
  })

  test('set with non-integer', () => {
    expect(() => seq.set(0.5, 2)).toThrow(TypeError)
    expect(() => seq.set(doc.createNode(0) as any, 2)).toThrow(TypeError)
  })
})

describe('Set', () => {
  let doc: Document
  let set: YAMLSet<number | string>
  beforeEach(() => {
    doc = new Document([1, 2, [3]], { tag: '!!set', version: '1.1' })
    set = doc.value as any
  })

  test('create', () => {
    expect(set).toMatchObject(_set([1, 2, [[3], _seq(3)]]))
  })

  test('add', () => {
    set.add('x')
    expect(set.get('x')).toMatchObject({ value: 'x' })
    set.add('x')
    const y0 = new Scalar('y')
    set.add(y0)
    set.add(new Scalar('y'))
    expect(set.get('y')).toBe(y0)
    expect(set.size).toBe(5)
  })

  test('get', () => {
    expect(set.get(1)).toMatchObject({ value: 1 })
    expect(set.get(0)).toBeUndefined()
    expect(set.get('1')).toBeUndefined()
    expect(set.get([3] as any)).toBeUndefined()
  })

  test('has', () => {
    expect(set.has(0)).toBe(false)
    expect(set.has(1)).toBe(true)
    expect(set.has(new Scalar(1))).toBe(true)
    const seq = Array.from(set.values.values()).at(-1)!
    expect(set.has(seq)).toBe(true)
  })

  test('delete', () => {
    expect(set.delete(0)).toBe(false)
    expect(set.delete(1)).toBe(true)
    expect(set.has(1)).toBe(false)
    expect(set.size).toBe(2)
  })
})

describe('OMap', () => {
  let doc: Document
  let omap: YAMLOMap
  beforeEach(() => {
    doc = new Document([{ a: 1 }, { b: { c: 3, d: 4 } }], {
      tag: '!!omap',
      version: '1.1'
    })
    omap = doc.value as any
  })

  test('create', () => {
    expect(omap).toMatchObject([
      _pair('a', 1),
      _pair('b', _map({ c: 3, d: 4 }))
    ])
  })

  test('push', () => {
    omap.push(doc.createPair('c', 'x'))
    expect(omap.at(-1)).toMatchObject({ value: { value: 'x' } })
    omap.push(doc.createPair('c', 'y'))
    expect(() => omap.toString()).toThrow()
    expect(() => omap.push('d' as any)).toThrow()
    expect(omap.size).toBe(4)
  })

  test('set', () => {
    omap.set(0, doc.createPair('a', 2))
    omap.set(1, doc.createPair('b', 5))
    omap.set(3, doc.createPair('d', 6))
    expect(omap).toMatchObject([
      _pair('a', 2),
      _pair('b', 5),
      undefined,
      _pair('d', 6)
    ])
    expect(omap.size).toBe(4)
    expect(String(doc)).toBe(`\
!!omap
- a: 2
- b: 5
- null
- d: 6\n`)
  })

  test('toString', () => {
    expect(String(doc)).toBe(`\
!!omap
- a: 1
- b:
    c: 3
    d: 4\n`)
  })
})

describe('Document', () => {
  test('get with map value', () => {
    const doc = new Document({ a: 1, b: [2, 3] })
    expect(doc.get('a')).toMatchObject({ value: 1 })
    expect(doc.get('c')).toBeUndefined()
  })

  test('get with seq value', () => {
    const doc = new Document([2, 3])
    expect(doc.get(0)).toMatchObject({ value: 2 })
    expect(doc.get(-1)).toMatchObject({ value: 3 })
    expect(() => doc.get('a')).toThrow()
  })

  test('get with scalar value', () => {
    const doc = new Document('s')
    expect(doc.get('a')).toBeUndefined()
  })

  test('set with map value', () => {
    const doc = new Document<any>({ a: 1, b: [2, 3] })
    doc.set('a', 2)
    expect(doc.get('a')).toMatchObject({ value: 2 })
    doc.set('c', 6)
    expect(doc.get('c')).toMatchObject({ value: 6 })
    expect(doc.value.size).toBe(3)
  })

  test('set with seq value', () => {
    const doc = new Document<any>([2, 3])
    doc.set(0, 4)
    expect(doc.get(0)).toMatchObject({ value: 4 })
    doc.set(3, 6)
    expect(doc.get(3)).toMatchObject({ value: 6 })
    expect(() => doc.set('a', 1)).toThrow(TypeError)
    expect(doc.value.size).toBe(4)
  })

  test('set with scalar value', () => {
    const doc = new Document('s')
    expect(() => doc.set('a', 1)).toThrow(/document value/)
  })
})
