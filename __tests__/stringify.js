import YAML from '../src/index'

test('undefined', () => {
  expect(YAML.stringify()).toBe('\n')
})

test('null', () => {
  expect(YAML.stringify(null)).toBe('null\n')
})

describe('boolean', () => {
  test('true', () => {
    expect(YAML.stringify(true)).toBe('true\n')
  })
  test('false', () => {
    expect(YAML.stringify(false)).toBe('false\n')
  })
})

describe('number', () => {
  test('integer', () => {
    expect(YAML.stringify(3)).toBe('3\n')
  })
  test('float', () => {
    expect(YAML.stringify(3.141)).toBe('3.141\n')
  })
  test('zero', () => {
    expect(YAML.stringify(0)).toBe('0\n')
  })
  test('NaN', () => {
    expect(YAML.stringify(NaN)).toBe('.nan\n')
  })
})

describe('string', () => {
  test('plain', () => {
    expect(YAML.stringify('STR')).toBe('STR\n')
  })
  test('quoted', () => {
    expect(YAML.stringify('"x"')).toBe('>-\n"x"\n')
  })
  test('escaped', () => {
    expect(YAML.stringify('null: \u0000')).toBe('"null: \\0"\n')
  })
})

test('array', () => {
  const array = [3, ['four', 5]]
  const str = YAML.stringify(array)
  expect(str).toBe(
    `- 3
- - four
  - 5\n`
  )
})

test('object', () => {
  const object = { x: 3, y: [4], z: { w: 'five', v: 6 } }
  const str = YAML.stringify(object)
  expect(str).toBe(
    `x: 3
y:
  - 4
z:
  w: five
  v: 6\n`
  )
})

test('Map with non-Pair item', () => {
  const doc = new YAML.Document()
  doc.contents = YAML.createNode({ x: 3, y: 4 })
  expect(String(doc)).toBe('x: 3\ny: 4\n')
  doc.contents.items.push('TEST')
  expect(() => String(doc)).toThrow(/^Map items must all be pairs.*TEST/)
})
