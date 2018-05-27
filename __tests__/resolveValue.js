import YAML from '../src/index'
import resolveValue from '../src/resolveValue'
import Map from '../src/schema/Map'
import Pair from '../src/schema/Pair'
import Scalar from '../src/schema/Scalar'
import Seq from '../src/schema/Seq'

let doc
beforeEach(() => {
  doc = new YAML.Document()
})

describe('scalars', () => {
  describe('doc#resolveValue(value) - wrapScalars true', () => {
    test('boolean', () => {
      const s = doc.resolveValue(false)
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe(false)
    })
    test('null', () => {
      const s = doc.resolveValue(null)
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe(null)
    })
    test('undefined', () => {
      const s = doc.resolveValue(undefined)
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe(null)
    })
    test('number', () => {
      const s = doc.resolveValue(3)
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe(3)
    })
    test('string', () => {
      const s = doc.resolveValue('test')
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe('test')
    })
  })
  describe('resolveValue(doc, value) - wrapScalars false', () => {
    test('boolean', () => {
      const s = resolveValue(doc, false)
      expect(s).toBe(false)
    })
    test('null', () => {
      const s = resolveValue(doc, null)
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe(null)
    })
    test('undefined', () => {
      const s = resolveValue(doc)
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe(null)
    })
    test('number', () => {
      const s = resolveValue(doc, 3)
      expect(s).toBe(3)
    })
    test('string', () => {
      const s = resolveValue(doc, 'test')
      expect(s).toBe('test')
    })
  })
})

describe('arrays', () => {
  test('[]', () => {
    const s = doc.resolveValue([])
    expect(s).toBeInstanceOf(Seq)
    expect(s.items).toHaveLength(0)
  })
  test('[true]', () => {
    const s = resolveValue(doc, [true])
    expect(s).toBeInstanceOf(Seq)
    expect(s.items).toMatchObject([true])
  })
  describe('[3, ["four", 5]]', () => {
    const array = [3, ['four', 5]]
    test('resolveValue(doc, value) - wrapScalars false', () => {
      const s = resolveValue(doc, array)
      expect(s).toBeInstanceOf(Seq)
      expect(s.items).toHaveLength(2)
      expect(s.items[0]).toBe(3)
      expect(s.items[1]).toBeInstanceOf(Seq)
      expect(s.items[1].items).toMatchObject(['four', 5])
    })
    test('doc#resolveValue(value) - wrapScalars true', () => {
      const s = doc.resolveValue(array)
      expect(s).toBeInstanceOf(Seq)
      expect(s.items).toHaveLength(2)
      expect(s.items[0].value).toBe(3)
      expect(s.items[1]).toBeInstanceOf(Seq)
      expect(s.items[1].items).toHaveLength(2)
      expect(s.items[1].items[0].value).toBe('four')
      expect(s.items[1].items[1].value).toBe(5)
    })
    test('set contents', () => {
      doc.contents = array
      expect(String(doc)).toBe('- 3\n- - four\n  - 5\n')
    })
  })
})

describe('objects', () => {
  test('{}', () => {
    const s = doc.resolveValue({})
    expect(s).toBeInstanceOf(Map)
    expect(s.items).toHaveLength(0)
  })
  test('{ x: true }', () => {
    const s = resolveValue(doc, { x: true })
    expect(s).toBeInstanceOf(Map)
    expect(s.items).toHaveLength(1)
    expect(s.items[0]).toBeInstanceOf(Pair)
    expect(s.items[0]).toMatchObject({ key: 'x', value: true })
  })
  describe('{ x: 3, y: [4], z: { w: "five", v: 6 } }', () => {
    const object = { x: 3, y: [4], z: { w: 'five', v: 6 } }
    test('resolveValue(doc, value) - wrapScalars false', () => {
      const s = resolveValue(doc, object)
      expect(s).toBeInstanceOf(Map)
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
    test('doc#resolveValue(value) - wrapScalars true', () => {
      const s = doc.resolveValue(object)
      expect(s).toBeInstanceOf(Map)
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
    test('set contents', () => {
      const res = `x: 3
y:
  - 4
z:
  w: five
  v: 6\n`
      doc.contents = object
      expect(String(doc)).toBe(res)
    })
  })
})
