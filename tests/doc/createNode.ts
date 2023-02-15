import { Alias, Document, Node, Scalar, YAMLMap, YAMLSeq } from 'yaml'
import { source } from '../_utils'

describe('createNode(value)', () => {
  test('boolean', () => {
    const s = new Document().createNode(false)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(false)
  })
  test('null', () => {
    const s = new Document().createNode(null)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(null)
  })
  test('undefined', () => {
    const s = new Document().createNode(undefined)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(null)
  })
  test('number', () => {
    const s = new Document().createNode(3)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(3)
  })
  test('string', () => {
    const s = new Document().createNode('test')
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe('test')
  })
})

describe('explicit tags', () => {
  test('default tag', () => {
    const s = new Document().createNode(3, { tag: '!!str' })
    expect(s).toBeInstanceOf(Scalar)
    expect(s).toMatchObject({ value: 3, tag: 'tag:yaml.org,2002:str' })
  })

  test('unknown tag', () => {
    expect(() => new Document().createNode('3', { tag: '!foo' })).toThrow(
      'Tag !foo not found'
    )
  })
})

describe('arrays', () => {
  test('createNode([])', () => {
    const s = new Document().createNode([])
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toHaveLength(0)
  })

  test('createNode([true])', () => {
    const doc = new Document()
    const s = doc.createNode([true])
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toMatchObject([{ value: true }])
    doc.contents = s
    expect(String(doc)).toBe('- true\n')
  })

  test('flow: true', () => {
    const doc = new Document()
    const s = doc.createNode([true], { flow: true })
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toMatchObject([{ value: true }])
    doc.contents = s
    expect(String(doc)).toBe('[ true ]\n')
  })

  describe('[3, ["four", 5]]', () => {
    const array = [3, ['four', 5]]
    test('createNode(value)', () => {
      const s = new Document().createNode(array) as any
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
      doc.contents = array as any
      expect(String(doc)).toBe(res)
      doc.contents = doc.createNode(array)
      expect(String(doc)).toBe(res)
    })
  })
})

describe('objects', () => {
  test('createNode({})', () => {
    const s = new Document().createNode({})
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toHaveLength(0)
  })

  test('createNode({ x: true })', () => {
    const doc = new Document()
    const s = doc.createNode({ x: true })
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toMatchObject([
      { key: { value: 'x' }, value: { value: true } }
    ])
    doc.contents = s
    expect(String(doc)).toBe('x: true\n')
  })

  test('flow: true', () => {
    const doc = new Document()
    const s = doc.createNode({ x: true }, { flow: true })
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toMatchObject([
      { key: { value: 'x' }, value: { value: true } }
    ])
    doc.contents = s
    expect(String(doc)).toBe('{ x: true }\n')
  })

  test('createNode({ x: true, y: undefined })', () => {
    const s = new Document().createNode({ x: true, y: undefined })
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toMatchObject([
      { key: { value: 'x' }, value: { value: true } }
    ])
  })

  test('createNode({ x: true, y: undefined }, { keepUndefined: true })', () => {
    const s = new Document().createNode(
      { x: true, y: undefined },
      { keepUndefined: true }
    )
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toMatchObject([
      { key: { value: 'x' }, value: { value: true } },
      { key: { value: 'y' }, value: { value: null } }
    ])
  })

  describe('{ x: 3, y: [4], z: { w: "five", v: 6 } }', () => {
    const object = { x: 3, y: [4], z: { w: 'five', v: 6 } }
    test('createNode(value)', () => {
      const s = new Document().createNode(object)
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
      doc.contents = object as any
      expect(String(doc)).toBe(res)
      doc.contents = doc.createNode(object)
      expect(String(doc)).toBe(res)
    })
  })
})

describe('Set', () => {
  test('createNode(new Set)', () => {
    const s = new Document().createNode(new Set())
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toHaveLength(0)
  })
  test('createNode(new Set([true]))', () => {
    const s = new Document().createNode(new Set([true]))
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toMatchObject([{ value: true }])
  })
  describe("Set { 3, Set { 'four', 5 } }", () => {
    const set = new Set([3, new Set(['four', 5])])
    test('createNode(set)', () => {
      const s = new Document().createNode(set) as any
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
      doc.contents = set as any
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
      const s = doc.createNode(set) as any
      expect(s.constructor.tag).toBe('tag:yaml.org,2002:set')
      expect(s.items).toMatchObject([
        { key: { value: 3 } },
        { key: { items: [{ key: { value: 'four' } }, { key: { value: 5 } }] } }
      ])
    })
  })
})

describe('Map', () => {
  test('createNode(new Map)', () => {
    const s = new Document().createNode(new Map())
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toHaveLength(0)
  })
  test('createNode(new Map([["x", true]]))', () => {
    const s = new Document().createNode(new Map([['x', true]]))
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toMatchObject([
      { key: { value: 'x' }, value: { value: true } }
    ])
  })
  describe("Map { 'x' => 3, 'y' => Set { 4 }, Map { 'w' => 'five', 'v' => 6 } => 'z' }", () => {
    const map = new Map<unknown, unknown>([
      ['x', 3],
      ['y', new Set([4])],
      [
        new Map<unknown, unknown>([
          ['w', 'five'],
          ['v', 6]
        ]),
        'z'
      ]
    ])
    test('createNode(map)', () => {
      const s = new Document().createNode(map)
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
      doc.contents = map as any
      expect(String(doc)).toBe(res)
      doc.contents = doc.createNode(map)
      expect(String(doc)).toBe(res)
    })
  })
})

describe('toJSON()', () => {
  test('Date', () => {
    const date = new Date('2018-12-22T08:02:52Z')
    const node = new Document().createNode(date)
    expect(node.value).toBe(date.toJSON())
  })
})

describe('strictly equal objects', () => {
  test('createNode([foo, foo])', () => {
    const foo = { foo: 'FOO' }
    const s = new Document().createNode([foo, foo])
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toMatchObject([
      {
        anchor: 'a1',
        items: [{ key: { value: 'foo' }, value: { value: 'FOO' } }]
      },
      { source: 'a1' }
    ])
  })

  test('createNode([foo, foo], { aliasDuplicateObjects: false })', () => {
    const foo = { foo: 'FOO' }
    const s = new Document().createNode([foo, foo], {
      aliasDuplicateObjects: false
    })
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toMatchObject([
      { items: [{ key: { value: 'foo' }, value: { value: 'FOO' } }] },
      { items: [{ key: { value: 'foo' }, value: { value: 'FOO' } }] }
    ])
  })
})

describe('circular references', () => {
  test('parent at root', () => {
    const map: any = { foo: 'bar' }
    map.map = map
    const doc = new Document(map)
    expect(doc.contents).toMatchObject({
      anchor: 'a1',
      items: [
        { key: { value: 'foo' }, value: { value: 'bar' } },
        {
          key: { value: 'map' },
          value: { source: 'a1' }
        }
      ]
    })
    expect(doc.toString()).toBe(source`
      &a1
      foo: bar
      map: *a1
    `)
  })

  test('ancestor at root', () => {
    const baz: any = {}
    const map = { foo: { bar: { baz } } }
    baz.map = map
    const doc = new Document(map)
    expect(doc.getIn(['foo', 'bar', 'baz', 'map'])).toMatchObject({
      source: 'a1'
    })
    expect(doc.toString()).toBe(source`
      &a1
      foo:
        bar:
          baz:
            map: *a1
    `)
  })

  test('sibling sequences', () => {
    const one = ['one']
    const two = ['two']
    const seq = [one, two, one, one, two]
    const doc = new Document(seq)
    expect(doc.contents).toMatchObject({
      items: [
        { items: [{ value: 'one' }] },
        { items: [{ value: 'two' }] },
        { source: 'a1' },
        { source: 'a1' },
        { source: 'a2' }
      ]
    })
    expect(doc.toString()).toBe(source`
      - &a1
        - one
      - &a2
        - two
      - *a1
      - *a1
      - *a2
    `)
  })

  test('further relatives', () => {
    const baz = { a: 1 }
    const seq = [{ foo: { bar: { baz } } }, { fe: { fi: { fo: { baz } } } }]
    const doc = new Document(null)
    const node = doc.createNode(seq)
    const source = node.getIn([0, 'foo', 'bar', 'baz']) as Node
    const alias = node.getIn([1, 'fe', 'fi', 'fo', 'baz']) as Alias
    expect(source).toMatchObject({
      items: [{ key: { value: 'a' }, value: { value: 1 } }]
    })
    expect(alias.source).toBe(source.anchor)
  })
})
