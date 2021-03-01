import { Document, PairType, Scalar, YAMLMap, YAMLSeq } from 'yaml'
import { YAMLSet } from '../../src/tags/yaml-1.1/set.js'

let doc
beforeEach(() => {
  doc = new Document()
})

describe('createNode(value)', () => {
  test('boolean', () => {
    const s = doc.createNode(false)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(false)
  })
  test('null', () => {
    const s = doc.createNode(null)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(null)
  })
  test('undefined', () => {
    const s = doc.createNode(undefined)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(null)
  })
  test('number', () => {
    const s = doc.createNode(3)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(3)
  })
  test('string', () => {
    const s = doc.createNode('test')
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe('test')
  })
})

describe('explicit tags', () => {
  test('default tag', () => {
    const s = doc.createNode(3, { tag: '!!str' })
    expect(s).toBeInstanceOf(Scalar)
    expect(s).toMatchObject({ value: 3, tag: 'tag:yaml.org,2002:str' })
  })

  test('unknown tag', () => {
    expect(() => doc.createNode('3', { tag: '!foo' })).toThrow(
      'Tag !foo not found'
    )
  })
})

describe('arrays', () => {
  test('createNode([])', () => {
    const s = doc.createNode([])
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toHaveLength(0)
  })

  test('createNode([true])', () => {
    const s = doc.createNode([true])
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toMatchObject([{ value: true }])
    doc.contents = s
    expect(String(doc)).toBe('- true\n')
  })

  test('flow: true', () => {
    const s = doc.createNode([true], { flow: true })
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toMatchObject([{ value: true }])
    doc.contents = s
    expect(String(doc)).toBe('[ true ]\n')
  })

  describe('[3, ["four", 5]]', () => {
    const array = [3, ['four', 5]]
    test('createNode(value)', () => {
      const s = doc.createNode(array)
      expect(s).toBeInstanceOf(YAMLSeq)
      expect(s.items).toHaveLength(2)
      expect(s.items[0].value).toBe(3)
      expect(s.items[1]).toBeInstanceOf(YAMLSeq)
      expect(s.items[1].items).toHaveLength(2)
      expect(s.items[1].items[0].value).toBe('four')
      expect(s.items[1].items[1].value).toBe(5)
    })
    test('set doc contents', () => {
      const res = '- 3\n- - four\n  - 5\n'
      const doc = new Document(array)
      expect(String(doc)).toBe(res)
      doc.contents = array
      expect(String(doc)).toBe(res)
      doc.contents = doc.createNode(array)
      expect(String(doc)).toBe(res)
    })
  })
})

describe('objects', () => {
  test('createNode({})', () => {
    const s = doc.createNode({})
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toHaveLength(0)
  })

  test('createNode({ x: true })', () => {
    const s = doc.createNode({ x: true })
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toMatchObject([
      { key: { value: 'x' }, value: { value: true } }
    ])
    doc.contents = s
    expect(String(doc)).toBe('x: true\n')
  })

  test('flow: true', () => {
    const s = doc.createNode({ x: true }, { flow: true })
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toMatchObject([
      { key: { value: 'x' }, value: { value: true } }
    ])
    doc.contents = s
    expect(String(doc)).toBe('{ x: true }\n')
  })

  test('createNode({ x: true, y: undefined })', () => {
    const s = doc.createNode({ x: true, y: undefined })
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toMatchObject([
      { type: PairType.PAIR, key: { value: 'x' }, value: { value: true } }
    ])
  })

  test('createNode({ x: true, y: undefined }, { keepUndefined: true })', () => {
    const s = doc.createNode({ x: true, y: undefined }, { keepUndefined: true })
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toMatchObject([
      { type: PairType.PAIR, key: { value: 'x' }, value: { value: true } },
      { type: PairType.PAIR, key: { value: 'y' }, value: { value: null } }
    ])
  })

  describe('{ x: 3, y: [4], z: { w: "five", v: 6 } }', () => {
    const object = { x: 3, y: [4], z: { w: 'five', v: 6 } }
    test('createNode(value)', () => {
      const s = doc.createNode(object)
      expect(s).toBeInstanceOf(YAMLMap)
      expect(s.items).toHaveLength(3)
      expect(s.items).toMatchObject([
        { key: { value: 'x' }, value: { value: 3 } },
        { key: { value: 'y' }, value: { items: [{ value: 4 }] } },
        {
          key: { value: 'z' },
          value: {
            items: [
              { key: { value: 'w' }, value: { value: 'five' } },
              { key: { value: 'v' }, value: { value: 6 } }
            ]
          }
        }
      ])
    })
    test('set doc contents', () => {
      const res = `x: 3
y:
  - 4
z:
  w: five
  v: 6\n`
      const doc = new Document(object)
      expect(String(doc)).toBe(res)
      doc.contents = object
      expect(String(doc)).toBe(res)
      doc.contents = doc.createNode(object)
      expect(String(doc)).toBe(res)
    })
  })
})

describe('Set', () => {
  test('createNode(new Set)', () => {
    const s = doc.createNode(new Set())
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toHaveLength(0)
  })
  test('createNode(new Set([true]))', () => {
    const s = doc.createNode(new Set([true]))
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toMatchObject([{ value: true }])
  })
  describe("Set { 3, Set { 'four', 5 } }", () => {
    const set = new Set([3, new Set(['four', 5])])
    test('createNode(set)', () => {
      const s = doc.createNode(set)
      expect(s).toBeInstanceOf(YAMLSeq)
      expect(s.items).toHaveLength(2)
      expect(s.items[0].value).toBe(3)
      expect(s.items[1]).toBeInstanceOf(YAMLSeq)
      expect(s.items[1].items).toHaveLength(2)
      expect(s.items[1].items[0].value).toBe('four')
      expect(s.items[1].items[1].value).toBe(5)
    })
    test('set doc contents', () => {
      const res = '- 3\n- - four\n  - 5\n'
      const doc = new Document(set)
      expect(String(doc)).toBe(res)
      doc.contents = set
      expect(String(doc)).toBe(res)
      doc.contents = doc.createNode(set)
      expect(String(doc)).toBe(res)
    })
    test('Schema#createNode() - YAML 1.2', () => {
      const doc = new Document(null)
      const s = doc.createNode(set)
      expect(s).toBeInstanceOf(YAMLSeq)
      expect(s.items).toMatchObject([
        { value: 3 },
        { items: [{ value: 'four' }, { value: 5 }] }
      ])
    })
    test('Schema#createNode() - YAML 1.1', () => {
      const doc = new Document(null, { version: '1.1' })
      const s = doc.createNode(set)
      expect(s).toBeInstanceOf(YAMLSet)
      expect(s.items).toMatchObject([
        { key: { value: 3 } },
        { key: { items: [{ key: { value: 'four' } }, { key: { value: 5 } }] } }
      ])
    })
  })
})

describe('Map', () => {
  test('createNode(new Map)', () => {
    const s = doc.createNode(new Map())
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toHaveLength(0)
  })
  test('createNode(new Map([["x", true]]))', () => {
    const s = doc.createNode(new Map([['x', true]]))
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toMatchObject([
      { key: { value: 'x' }, value: { value: true } }
    ])
  })
  describe("Map { 'x' => 3, 'y' => Set { 4 }, Map { 'w' => 'five', 'v' => 6 } => 'z' }", () => {
    const map = new Map([
      ['x', 3],
      ['y', new Set([4])],
      [
        new Map([
          ['w', 'five'],
          ['v', 6]
        ]),
        'z'
      ]
    ])
    test('createNode(map)', () => {
      const s = doc.createNode(map)
      expect(s).toBeInstanceOf(YAMLMap)
      expect(s.items).toHaveLength(3)
      expect(s.items).toMatchObject([
        { key: { value: 'x' }, value: { value: 3 } },
        { key: { value: 'y' }, value: { items: [{ value: 4 }] } },
        {
          key: {
            items: [
              { key: { value: 'w' }, value: { value: 'five' } },
              { key: { value: 'v' }, value: { value: 6 } }
            ]
          },
          value: { value: 'z' }
        }
      ])
    })
    test('set doc contents', () => {
      const res = `x: 3
y:
  - 4
? w: five
  v: 6
: z\n`
      const doc = new Document(map)
      expect(String(doc)).toBe(res)
      doc.contents = map
      expect(String(doc)).toBe(res)
      doc.contents = doc.createNode(map)
      expect(String(doc)).toBe(res)
    })
  })
})

describe('toJSON()', () => {
  test('Date', () => {
    const date = new Date('2018-12-22T08:02:52Z')
    const node = doc.createNode(date)
    expect(node.value).toBe(date.toJSON())
  })
})

describe('circular references', () => {
  test('parent at root', () => {
    const map = { foo: 'bar' }
    map.map = map
    const doc = new Document(null)
    expect(doc.createNode(map)).toMatchObject({
      items: [
        { key: { value: 'foo' }, value: { value: 'bar' } },
        {
          key: { value: 'map' },
          value: {
            type: 'ALIAS',
            source: {
              items: [{ key: { value: 'foo' } }, { key: { value: 'map' } }]
            }
          }
        }
      ]
    })
    expect(doc.anchors.map).toMatchObject({
      a1: { items: [{ key: { value: 'foo' } }, { key: { value: 'map' } }] }
    })
  })

  test('ancestor at root', () => {
    const baz = {}
    const map = { foo: { bar: { baz } } }
    baz.map = map
    const doc = new Document(null)
    const node = doc.createNode(map)
    expect(node.getIn(['foo', 'bar', 'baz', 'map'])).toMatchObject({
      type: 'ALIAS',
      source: { items: [{ key: { value: 'foo' } }] }
    })
    expect(doc.anchors.map).toMatchObject({
      a1: { items: [{ key: { value: 'foo' } }] }
    })
  })

  test('sibling sequences', () => {
    const one = ['one']
    const two = ['two']
    const seq = [one, two, one, one, two]
    const doc = new Document(null)
    expect(doc.createNode(seq)).toMatchObject({
      items: [
        { items: [{ value: 'one' }] },
        { items: [{ value: 'two' }] },
        { type: 'ALIAS', source: { items: [{ value: 'one' }] } },
        { type: 'ALIAS', source: { items: [{ value: 'one' }] } },
        { type: 'ALIAS', source: { items: [{ value: 'two' }] } }
      ]
    })
    expect(doc.anchors.map).toMatchObject({
      a1: { items: [{ value: 'one' }] },
      a2: { items: [{ value: 'two' }] }
    })
  })

  test('further relatives', () => {
    const baz = { a: 1 }
    const seq = [{ foo: { bar: { baz } } }, { fe: { fi: { fo: { baz } } } }]
    const doc = new Document(null)
    const node = doc.createNode(seq)
    const source = node.getIn([0, 'foo', 'bar', 'baz'])
    const alias = node.getIn([1, 'fe', 'fi', 'fo', 'baz'])
    expect(source).toMatchObject({
      items: [{ key: { value: 'a' }, value: { value: 1 } }]
    })
    expect(alias).toMatchObject({ type: 'ALIAS' })
    expect(alias.source).toBe(source)
  })
})
