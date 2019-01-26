import YAML from '../../src/index'
import YAMLMap from '../../src/schema/Map'
import Pair from '../../src/schema/Pair'
import Scalar from '../../src/schema/Scalar'
import YAMLSeq from '../../src/schema/Seq'
import { YAMLSet } from '../../src/schema/_set'

describe('scalars', () => {
  describe('createNode(value, false)', () => {
    test('boolean', () => {
      const s = YAML.createNode(false, false)
      expect(s).toBe(false)
    })
    test('null', () => {
      const s = YAML.createNode(null, false)
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe(null)
    })
    test('undefined', () => {
      const s = YAML.createNode(undefined, false)
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe(null)
    })
    test('number', () => {
      const s = YAML.createNode(3, false)
      expect(s).toBe(3)
    })
    test('string', () => {
      const s = YAML.createNode('test', false)
      expect(s).toBe('test')
    })
  })
})

describe('createNode(value, true)', () => {
  test('boolean', () => {
    const s = YAML.createNode(false, true)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(false)
  })
  test('null', () => {
    const s = YAML.createNode(null, true)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(null)
  })
  test('undefined', () => {
    const s = YAML.createNode(undefined, true)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(null)
  })
  test('number', () => {
    const s = YAML.createNode(3, true)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(3)
  })
  test('string', () => {
    const s = YAML.createNode('test', true)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe('test')
  })
})

describe('arrays', () => {
  test('createNode([])', () => {
    const s = YAML.createNode([])
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toHaveLength(0)
  })
  test('createNode([true], false)', () => {
    const s = YAML.createNode([true], false)
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toMatchObject([true])
  })
  describe('[3, ["four", 5]]', () => {
    const array = [3, ['four', 5]]
    test('createNode(value, false)', () => {
      const s = YAML.createNode(array, false)
      expect(s).toBeInstanceOf(YAMLSeq)
      expect(s.items).toHaveLength(2)
      expect(s.items[0]).toBe(3)
      expect(s.items[1]).toBeInstanceOf(YAMLSeq)
      expect(s.items[1].items).toMatchObject(['four', 5])
    })
    test('createNode(value, true)', () => {
      const s = YAML.createNode(array, true)
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
      const doc = new YAML.Document()
      doc.contents = array
      expect(String(doc)).toBe(res)
      doc.contents = YAML.createNode(array, false)
      expect(String(doc)).toBe(res)
      doc.contents = YAML.createNode(array, true)
      expect(String(doc)).toBe(res)
    })
  })
})

describe('objects', () => {
  test('createNode({})', () => {
    const s = YAML.createNode({})
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toHaveLength(0)
  })
  test('createNode({ x: true }, false)', () => {
    const s = YAML.createNode({ x: true }, false)
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toHaveLength(1)
    expect(s.items[0]).toBeInstanceOf(Pair)
    expect(s.items[0]).toMatchObject({ key: 'x', value: true })
  })
  describe('{ x: 3, y: [4], z: { w: "five", v: 6 } }', () => {
    const object = { x: 3, y: [4], z: { w: 'five', v: 6 } }
    test('createNode(value, false)', () => {
      const s = YAML.createNode(object, false)
      expect(s).toBeInstanceOf(YAMLMap)
      expect(s.items).toHaveLength(3)
      expect(s.items).toMatchObject([
        { key: 'x', value: 3 },
        { key: 'y', value: { items: [4] } },
        {
          key: 'z',
          value: {
            items: [{ key: 'w', value: 'five' }, { key: 'v', value: 6 }]
          }
        }
      ])
    })
    test('createNode(value, true)', () => {
      const s = YAML.createNode(object, true)
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
      const doc = new YAML.Document()
      doc.contents = object
      expect(String(doc)).toBe(res)
      doc.contents = YAML.createNode(object, false)
      expect(String(doc)).toBe(res)
      doc.contents = YAML.createNode(object, true)
      expect(String(doc)).toBe(res)
    })
  })
})

describe('Set', () => {
  test('createNode(new Set)', () => {
    const s = YAML.createNode(new Set())
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toHaveLength(0)
  })
  test('createNode(new Set([true]), false)', () => {
    const s = YAML.createNode(new Set([true]), false)
    expect(s).toBeInstanceOf(YAMLSeq)
    expect(s.items).toMatchObject([true])
  })
  describe("Set { 3, Set { 'four', 5 } }", () => {
    const set = new Set([3, new Set(['four', 5])])
    test('createNode(set, false)', () => {
      const s = YAML.createNode(set, false)
      expect(s).toBeInstanceOf(YAMLSeq)
      expect(s.items).toHaveLength(2)
      expect(s.items[0]).toBe(3)
      expect(s.items[1]).toBeInstanceOf(YAMLSeq)
      expect(s.items[1].items).toMatchObject(['four', 5])
    })
    test('createNode(set, true)', () => {
      const s = YAML.createNode(set, true)
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
      const doc = new YAML.Document()
      doc.contents = set
      expect(String(doc)).toBe(res)
      doc.contents = YAML.createNode(set, false)
      expect(String(doc)).toBe(res)
      doc.contents = YAML.createNode(set, true)
      expect(String(doc)).toBe(res)
    })
    test('Schema#createNode() - YAML 1.2', () => {
      const doc = new YAML.Document()
      doc.setSchema()
      const s = doc.schema.createNode(set, true)
      expect(s).toBeInstanceOf(YAMLSeq)
      expect(s.items).toMatchObject([
        { value: 3 },
        { items: [{ value: 'four' }, { value: 5 }] }
      ])
    })
    test('Schema#createNode() - YAML 1.1', () => {
      const doc = new YAML.Document({ version: '1.1' })
      doc.setSchema()
      const s = doc.schema.createNode(set, true)
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
    const s = YAML.createNode(new Map())
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toHaveLength(0)
  })
  test('createNode(new Map([["x", true]]), false)', () => {
    const s = YAML.createNode(new Map([['x', true]]), false)
    expect(s).toBeInstanceOf(YAMLMap)
    expect(s.items).toHaveLength(1)
    expect(s.items[0]).toBeInstanceOf(Pair)
    expect(s.items[0]).toMatchObject({ key: 'x', value: true })
  })
  describe("Map { 'x' => 3, 'y' => Set { 4 }, Map { 'w' => 'five', 'v' => 6 } => 'z' }", () => {
    const map = new Map([
      ['x', 3],
      ['y', new Set([4])],
      [new Map([['w', 'five'], ['v', 6]]), 'z']
    ])
    test('createNode(map, false)', () => {
      const s = YAML.createNode(map, false)
      expect(s).toBeInstanceOf(YAMLMap)
      expect(s.items).toHaveLength(3)
      expect(s.items).toMatchObject([
        { key: 'x', value: 3 },
        { key: 'y', value: { items: [4] } },
        {
          key: {
            items: [{ key: 'w', value: 'five' }, { key: 'v', value: 6 }]
          },
          value: 'z'
        }
      ])
    })
    test('createNode(map, true)', () => {
      const s = YAML.createNode(map, true)
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
      const doc = new YAML.Document()
      doc.contents = map
      expect(String(doc)).toBe(res)
      doc.contents = YAML.createNode(map, false)
      expect(String(doc)).toBe(res)
      doc.contents = YAML.createNode(map, true)
      expect(String(doc)).toBe(res)
    })
  })
})

describe('toJSON()', () => {
  test('Date', () => {
    const date = new Date('2018-12-22T08:02:52Z')
    const node = YAML.createNode(date)
    expect(node.value).toBe(date.toJSON())
  })
})
