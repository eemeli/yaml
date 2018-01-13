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

const testScalarParse = ({ pre, post, str, comment, expected }) => {
  const scalar = new Scalar(pre + str + (comment ? ` #${comment}` : '') + post)
  const indent = scalar.endIndent(0).length
  const end = scalar.parse(pre.length, indent, false)
  let expectedEnd = pre.length + str.length
  expectedEnd = comment ? scalar.endLine(expectedEnd) : scalar.endWhiteSpace(expectedEnd)
  expect(scalar.rawValue).toBe(expected || str)
  expect(end).toBe(expectedEnd)
  if (comment) expect(scalar.comment).toBe(comment)
  expect(scalar).toMatchSnapshot()
}

const commonTests = {
  'bare': { pre: '', post: '' },
  'newline before & after': { pre: '\n', post: '\n' },
  'complex mapping key': { pre: '? ', post: ' : ' },
  'seq value': { pre: '- ', post: '\n- ' },
  'indented block': { pre: '    - ', post: '\n  x' },
  'flow seq value': { pre: '[ ', post: ' ]' },
  'with comment': { pre: '\n  ', comment: 'comment # here!', post: '\n' }
}

describe('parse "quoted"', () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '"value"' }, commonTests[name])
    test(name, () => testScalarParse(props))
  }
  test('without spaces', () => testScalarParse({ pre: '{', str: '"value"', post: ',' }))
  test('multi-line', () => testScalarParse({ pre: '\n', str: '"value\nwith\nmore lines"', post: '\n' }))
  test('escaped', () => testScalarParse({ pre: '\n', str: '"value\\\\\nwith \\"more\\" lines\\""', post: '\n' }))
})

describe("parse 'quoted'", () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: "'value'" }, commonTests[name])
    test(name, () => testScalarParse(props))
  }
  test('without spaces', () => testScalarParse({ pre: '{', str: "'value'", post: ',' }))
  test('multi-line', () => testScalarParse({ pre: '\n', str: "'value\nwith\nmore lines'", post: '\n' }))
  test('escaped', () => testScalarParse({ pre: '\n', str: "'value\nwith ''more'' lines'''", post: '\n' }))
})

describe("parse *alias", () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '*alias', expected: 'alias' }, commonTests[name])
    test(name, () => testScalarParse(props))
  }
})
