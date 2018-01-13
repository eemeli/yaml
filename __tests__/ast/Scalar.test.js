import Scalar from '../../src/ast/Scalar'

describe('internals', () => {
  test('constructor', () => {
    const src = 'src'
    const s = new Scalar(src)
    expect(s.src).toBe(src)
  })
  test('endIndent', () => {
    const src = '  - value\n- other\n'
    const s = new Scalar(src)
    const in1 = s.endIndent(0)
    expect(in1).toBe(2)
    const offset = src.indexOf('\n') + 1
    const in2 = s.endIndent(offset)
    expect(in2).toBe(offset)
  })
})

const testScalarParse = (pre, str, post, expected) => {
  const scalar = new Scalar(pre + str + post)
  const indent = scalar.endIndent(0).length
  const end = scalar.parse(pre.length, indent, false)
  const expectedEnd = scalar.endWhiteSpace(pre.length + str.length)
  expect(scalar.rawValue).toBe(expected || str)
  expect(end).toBe(expectedEnd)
  expect(scalar).toMatchSnapshot()
}

const commonTests = {
  'bare': { pre: '', post: '' },
  'newline before & after': { pre: '\n', post: '\n' },
  'complex mapping key': { pre: '? ', post: ' : ' },
  'seq value': { pre: '- ', post: '\n- ' },
  'indented block': { pre: '    - ', post: '\n  x' },
  'flow seq value': { pre: '[ ', post: ' ]' }
}

describe('parse "quoted"', () => {
  for (const name in commonTests) {
    const { pre, post } = commonTests[name]
    test(name, () => testScalarParse(pre, '"value"', post))
  }
  test('without spaces', () => testScalarParse('{', '"value"', ','))
  test('multi-line', () => testScalarParse('\n', '"value\nwith\nmore lines"', '\n'))
  test('escaped', () => testScalarParse('\n', '"value\\\\\nwith \\"more\\" lines\\""', '\n'))
})

describe("parse 'quoted'", () => {
  for (const name in commonTests) {
    const { pre, post } = commonTests[name]
    test(name, () => testScalarParse(pre, "'value'", post))
  }
  test('without spaces', () => testScalarParse('{', "'value'", ','))
  test('multi-line', () => testScalarParse('\n', "'value\nwith\nmore lines'", '\n'))
  test('escaped', () => testScalarParse('\n', "'value\nwith ''more'' lines'''", '\n'))
})

describe("parse *alias", () => {
  for (const name in commonTests) {
    const { pre, post } = commonTests[name]
    test(name, () => testScalarParse(pre, '*alias', post, 'alias'))
  }
})
