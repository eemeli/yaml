import YAML from '../../src/index'
import Pair from '../../src/schema/Pair'

describe('Map', () => {
  let map
  beforeEach(() => {
    map = YAML.createNode({ a: 1, b: { c: 3, d: 4 } })
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
    expect(map.get('b').toJSON()).toMatchObject({ c: 3, d: 4 })
    expect(map.get('c')).toBeUndefined()
  })

  test('get with node', () => {
    expect(map.get(YAML.createNode('a'))).toBe(1)
    expect(map.get(YAML.createNode('a'), true)).toMatchObject({ value: 1 })
    expect(map.get(YAML.createNode('b')).toJSON()).toMatchObject({ c: 3, d: 4 })
    expect(map.get(YAML.createNode('c'))).toBeUndefined()
  })

  test('has with value', () => {
    expect(map.has('a')).toBe(true)
    expect(map.has('b')).toBe(true)
    expect(map.has('c')).toBe(false)
    expect(map.has('')).toBe(false)
    expect(map.has()).toBe(false)
  })

  test('has with node', () => {
    expect(map.has(YAML.createNode('a'))).toBe(true)
    expect(map.has(YAML.createNode('b'))).toBe(true)
    expect(map.has(YAML.createNode('c'))).toBe(false)
    expect(map.has(YAML.createNode())).toBe(false)
  })

  test('set with value', () => {
    map.set('a', 2)
    expect(map.get('a')).toBe(2)
    expect(map.get('a', true)).toBe(2)
    map.set('b', 5)
    expect(map.get('b')).toBe(5)
    map.set('c', 6)
    expect(map.get('c')).toBe(6)
    expect(map.items).toHaveLength(3)
  })

  test('set with node', () => {
    map.set(YAML.createNode('a'), 2)
    expect(map.get('a')).toBe(2)
    expect(map.get('a', true)).toBe(2)
    map.set(YAML.createNode('b'), 5)
    expect(map.get('b')).toBe(5)
    map.set(YAML.createNode('c'), 6)
    expect(map.get('c')).toBe(6)
    expect(map.items).toHaveLength(3)
  })
})

describe('Seq', () => {
  let seq
  beforeEach(() => {
    seq = YAML.createNode([1, [2, 3]])
    expect(seq.items).toMatchObject([
      { value: 1 },
      { items: [{ value: 2 }, { value: 3 }] }
    ])
  })

  test('add', () => {
    seq.add('x')
    expect(seq.get(2)).toBe('x')
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
    expect(seq.get(1).toJSON()).toMatchObject([2, 3])
    expect(seq.get(2)).toBeUndefined()
  })

  test('get with node', () => {
    expect(seq.get(YAML.createNode(0))).toBe(1)
    expect(seq.get(YAML.createNode('0'))).toBe(1)
    expect(seq.get(YAML.createNode(0), true)).toMatchObject({ value: 1 })
    expect(seq.get(YAML.createNode(1)).toJSON()).toMatchObject([2, 3])
    expect(seq.get(YAML.createNode(2))).toBeUndefined()
  })

  test('has with value', () => {
    expect(seq.has(0)).toBe(true)
    expect(seq.has(1)).toBe(true)
    expect(seq.has(2)).toBe(false)
    expect(seq.has('0')).toBe(true)
    expect(seq.has('')).toBe(false)
    expect(seq.has()).toBe(false)
  })

  test('has with node', () => {
    expect(seq.has(YAML.createNode(0))).toBe(true)
    expect(seq.has(YAML.createNode('0'))).toBe(true)
    expect(seq.has(YAML.createNode(2))).toBe(false)
    expect(seq.has(YAML.createNode(''))).toBe(false)
    expect(seq.has(YAML.createNode())).toBe(false)
  })

  test('set with value', () => {
    seq.set(0, 2)
    expect(seq.get(0)).toBe(2)
    expect(seq.get(0, true)).toBe(2)
    seq.set('1', 5)
    expect(seq.get(1)).toBe(5)
    seq.set(2, 6)
    expect(seq.get(2)).toBe(6)
    expect(seq.items).toHaveLength(3)
  })

  test('set with node', () => {
    seq.set(YAML.createNode(0), 2)
    expect(seq.get(0)).toBe(2)
    expect(seq.get(0, true)).toBe(2)
    seq.set(YAML.createNode('1'), 5)
    expect(seq.get(1)).toBe(5)
    seq.set(YAML.createNode(2), 6)
    expect(seq.get(2)).toBe(6)
    expect(seq.items).toHaveLength(3)
  })
})

describe('Set', () => {
  let doc
  beforeAll(() => {
    doc = new YAML.Document({ version: '1.1' })
    doc.setSchema()
  })

  let set
  beforeEach(() => {
    set = doc.schema.createNode([1, 2, 3], true, '!!set')
    expect(set.items).toMatchObject([
      { key: { value: 1 }, value: null },
      { key: { value: 2 }, value: null },
      { key: { value: 3 }, value: null }
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
    expect(set.get(1, true)).toMatchObject({ key: { value: 1 }, value: null })
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
  let doc
  beforeAll(() => {
    doc = new YAML.Document({ version: '1.1' })
    doc.setSchema()
  })

  let omap
  beforeEach(() => {
    omap = doc.schema.createNode(
      [{ a: 1 }, { b: { c: 3, d: 4 } }],
      true,
      '!!omap'
    )
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
    expect(omap.get('b').toJSON()).toMatchObject({ c: 3, d: 4 })
    expect(omap.get('c')).toBeUndefined()
  })

  test('has', () => {
    expect(omap.has('a')).toBe(true)
    expect(omap.has('b')).toBe(true)
    expect(omap.has('c')).toBe(false)
    expect(omap.has('')).toBe(false)
    expect(omap.has()).toBe(false)
  })

  test('set', () => {
    omap.set('a', 2)
    expect(omap.get('a')).toBe(2)
    expect(omap.get('a', true)).toBe(2)
    omap.set('b', 5)
    expect(omap.get('b')).toBe(5)
    omap.set('c', 6)
    expect(omap.get('c')).toBe(6)
    expect(omap.items).toHaveLength(3)
  })
})

describe('Collection', () => {
  let map
  beforeEach(() => {
    map = YAML.createNode({ a: 1, b: [2, 3] })
  })

  test('addIn', () => {
    map.addIn(['b'], 4)
    expect(map.getIn(['b', 2])).toBe(4)
    map.addIn([], new Pair('c', 5))
    expect(map.get('c')).toBe(5)
    expect(() => map.addIn(['a'])).toThrow(/Expected YAML collection/)
    expect(() => map.addIn(['b', 3])).toThrow(/Expected YAML collection/)
    expect(map.items).toHaveLength(3)
    expect(map.get('b').items).toHaveLength(3)
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
    expect(map.get('b').items).toHaveLength(1)
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
    expect(map.get('a', true)).toBe(2)
    map.setIn(['b', 1], 5)
    expect(map.getIn(['b', 1])).toBe(5)
    map.setIn([1], 6)
    expect(map.get(1)).toBe(6)
    map.setIn(['b', 2], 6)
    expect(map.getIn(['b', 2])).toBe(6)
    expect(() => map.setIn(['a', 'e'])).toThrow(/Expected YAML collection/)
    expect(() => map.setIn(['e', 'e'])).toThrow(/Expected YAML collection/)
    expect(map.items).toHaveLength(3)
    expect(map.get('b').items).toHaveLength(3)
  })
})

describe('Document', () => {
  let doc
  beforeEach(() => {
    doc = new YAML.Document()
    doc.contents = YAML.createNode({ a: 1, b: [2, 3] })
    expect(doc.contents.items).toMatchObject([
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
    expect(doc.contents.items).toHaveLength(3)
  })

  test('addIn', () => {
    doc.addIn(['b'], 4)
    expect(doc.getIn(['b', 2])).toBe(4)
    doc.addIn([], new Pair('c', 5))
    expect(doc.get('c')).toBe(5)
    expect(() => doc.addIn(['a'])).toThrow(/Expected YAML collection/)
    expect(() => doc.addIn(['b', 3])).toThrow(/Expected YAML collection/)
    expect(doc.contents.items).toHaveLength(3)
    expect(doc.get('b').items).toHaveLength(3)
  })

  test('delete', () => {
    expect(doc.delete('a')).toBe(true)
    expect(doc.delete('a')).toBe(false)
    expect(doc.get('a')).toBeUndefined()
    expect(doc.contents.items).toHaveLength(1)

    doc.contents = YAML.createNode('s')
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
    expect(doc.contents.items).toHaveLength(1)
    expect(doc.get('b').items).toHaveLength(1)
  })

  test('get', () => {
    expect(doc.get('a')).toBe(1)
    expect(doc.get('a', true)).toMatchObject({ value: 1 })
    expect(doc.get('c')).toBeUndefined()

    doc.contents = YAML.createNode('s')
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
    doc.contents = YAML.createNode('s')
    expect(doc.getIn([])).toBe('s')
    expect(doc.getIn(null, true)).toMatchObject({ value: 's' })
    expect(doc.getIn([0])).toBeUndefined()
  })

  test('has', () => {
    expect(doc.has('a')).toBe(true)
    expect(doc.has('c')).toBe(false)

    doc.contents = YAML.createNode('s')
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
    expect(doc.get('a', true)).toBe(2)
    doc.set('c', 6)
    expect(doc.get('c')).toBe(6)
    expect(doc.contents.items).toHaveLength(3)

    doc.contents = YAML.createNode('s')
    expect(() => doc.set('a', 1)).toThrow(/document contents/)
  })

  test('setIn', () => {
    doc.setIn(['a'], 2)
    expect(doc.getIn(['a'])).toBe(2)
    expect(doc.getIn(['a'], true)).toBe(2)
    doc.setIn(['b', 1], 5)
    expect(doc.getIn(['b', 1])).toBe(5)
    doc.setIn(['c'], 6)
    expect(doc.getIn(['c'])).toBe(6)
    expect(() => doc.setIn(['a', 'e'])).toThrow(/Expected YAML collection/)
    expect(() => doc.setIn(['e', 'e'], 1)).toThrow(/Expected YAML collection/)
    expect(doc.contents.items).toHaveLength(3)
    expect(doc.get('b').items).toHaveLength(2)

    doc.contents = YAML.createNode('s')
    expect(() => doc.setIn(['a'], 1)).toThrow(/document contents/)
  })
})
