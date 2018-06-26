import YAML from '../src/index'
import resolveValue from '../src/resolveValue'
import Map from '../src/schema/Map'
import Pair from '../src/schema/Pair'
import Scalar from '../src/schema/Scalar'
import Seq from '../src/schema/Seq'

describe('scalars', () => {
  describe('resolveValue(value, false)', () => {
    test('boolean', () => {
      const s = resolveValue(false, false)
      expect(s).toBe(false)
    })
    test('null', () => {
      const s = resolveValue(null, false)
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe(null)
    })
    test('undefined', () => {
      const s = resolveValue(undefined, false)
      expect(s).toBeInstanceOf(Scalar)
      expect(s.value).toBe(null)
    })
    test('number', () => {
      const s = resolveValue(3, false)
      expect(s).toBe(3)
    })
    test('string', () => {
      const s = resolveValue('test', false)
      expect(s).toBe('test')
    })
  })
})

describe('resolveValue(value, true)', () => {
  test('boolean', () => {
    const s = resolveValue(false, true)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(false)
  })
  test('null', () => {
    const s = resolveValue(null, true)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(null)
  })
  test('undefined', () => {
    const s = resolveValue(undefined, true)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(null)
  })
  test('number', () => {
    const s = resolveValue(3, true)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe(3)
  })
  test('string', () => {
    const s = resolveValue('test', true)
    expect(s).toBeInstanceOf(Scalar)
    expect(s.value).toBe('test')
  })
})

describe('arrays', () => {
  test('resolveValue([])', () => {
    const s = resolveValue([])
    expect(s).toBeInstanceOf(Seq)
    expect(s.items).toHaveLength(0)
  })
  test('resolveValue([true], false)', () => {
    const s = resolveValue([true], false)
    expect(s).toBeInstanceOf(Seq)
    expect(s.items).toMatchObject([true])
  })
  describe('[3, ["four", 5]]', () => {
    const array = [3, ['four', 5]]
    test('resolveValue(value, false)', () => {
      const s = resolveValue(array, false)
      expect(s).toBeInstanceOf(Seq)
      expect(s.items).toHaveLength(2)
      expect(s.items[0]).toBe(3)
      expect(s.items[1]).toBeInstanceOf(Seq)
      expect(s.items[1].items).toMatchObject(['four', 5])
    })
    test('resolveValue(value, true)', () => {
      const s = resolveValue(array, true)
      expect(s).toBeInstanceOf(Seq)
      expect(s.items).toHaveLength(2)
      expect(s.items[0].value).toBe(3)
      expect(s.items[1]).toBeInstanceOf(Seq)
      expect(s.items[1].items).toHaveLength(2)
      expect(s.items[1].items[0].value).toBe('four')
      expect(s.items[1].items[1].value).toBe(5)
    })
    test('set doc contents', () => {
      const res = '- 3\n- - four\n  - 5\n'
      const doc = new YAML.Document()
      doc.contents = array
      expect(String(doc)).toBe(res)
      doc.contents = resolveValue(array, false)
      expect(String(doc)).toBe(res)
      doc.contents = resolveValue(array, true)
      expect(String(doc)).toBe(res)
    })
  })
})

describe('objects', () => {
  test('resolveValue({})', () => {
    const s = resolveValue({})
    expect(s).toBeInstanceOf(Map)
    expect(s.items).toHaveLength(0)
  })
  test('resolveValue({ x: true }, false)', () => {
    const s = resolveValue({ x: true }, false)
    expect(s).toBeInstanceOf(Map)
    expect(s.items).toHaveLength(1)
    expect(s.items[0]).toBeInstanceOf(Pair)
    expect(s.items[0]).toMatchObject({ key: 'x', value: true })
  })
  describe('{ x: 3, y: [4], z: { w: "five", v: 6 } }', () => {
    const object = { x: 3, y: [4], z: { w: 'five', v: 6 } }
    test('resolveValue(value, false)', () => {
      const s = resolveValue(object, false)
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
    test('resolveValue(value, true)', () => {
      const s = resolveValue(object, true)
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
      doc.contents = resolveValue(object, false)
      expect(String(doc)).toBe(res)
      doc.contents = resolveValue(object, true)
      expect(String(doc)).toBe(res)
    })
  })
})
