import Scalar from '../../src/ast/Scalar'

const testScalarParse = ({ pre, post, str, comment, expected, inFlow, startIdx, test: customTest }) => {
  let body = str
  if (comment) {
    const lines = body.split('\n')
    lines[0] += ` #${comment}`
    body = lines.join('\n')
  }
  const scalar = new Scalar(pre + body + post)
  const indent = scalar.endIndent(0)
  const end = scalar.parse(startIdx || pre.length, indent, inFlow || false)
  const expectedEnd = scalar.endWhiteSpace(pre.length + body.length)
  expect(scalar.rawValue).toBe(expected || str)
  expect(end).toBe(expectedEnd)
  if (comment) expect(scalar.comment).toBe(comment)
  if (customTest) customTest(scalar)
  expect(scalar).toMatchSnapshot()
}

const commonTests = {
  'bare': { pre: '', post: '' },
  'newline before & after': { pre: '\n', post: '\n' },
  'complex mapping key': { pre: '? ', post: ' : ' },
  'seq value': { pre: '- ', post: '\n- ' },
  'indented block': { pre: '    - ', post: '\n  x' },
  'flow seq value': { pre: '[ ', post: ' ]', inFlow: true },
  'with comment': { pre: '\n  ', comment: 'comment # here!', post: '\n' },
  'with props': { pre: '- !tag! &anchor ', post: '\n- ', startIdx: 2, test: (scalar) => {
    expect(scalar.anchor).toBe('anchor')
    expect(scalar.tag).toBe('tag!')
  } }
}

describe('parse "quoted"', () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '"value"' }, commonTests[name])
    test(name, () => testScalarParse(props))
  }
  test('without spaces', () => testScalarParse({ pre: '{', str: '"value"', post: ',' }))
  test('multi-line', () => testScalarParse({ pre: '\n', str: '"value\nwith\nmore lines"', post: '\n' }))
  test('escaped', () => testScalarParse({ pre: '\n', str: '" #value\\\\\nwith \\"more\\" lines\\""', post: '\n' }))
})

describe("parse 'quoted'", () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: "'value'" }, commonTests[name])
    test(name, () => testScalarParse(props))
  }
  test('without spaces', () => testScalarParse({ pre: '{', str: "'value'", post: ',' }))
  test('multi-line', () => testScalarParse({ pre: '\n', str: "'value\nwith\nmore lines'", post: '\n' }))
  test('escaped', () => testScalarParse({ pre: '\n', str: "' #value\nwith ''more'' lines'''", post: '\n' }))
})

describe("parse *alias", () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '*alias', expected: 'alias' }, commonTests[name])
    test(name, () => testScalarParse(props))
  }
})

describe("parse >block", () => {
  const block = '      #multiline\n  \n      \tblock'
  for (const name in commonTests) {
    const props = Object.assign({ str: `>\n${block}`, expected: block }, commonTests[name])
    if (props.post && props.post[0] !== '\n') {
      props.pre = `  ${props.pre}`
      props.post = props.post.replace(/^\s?/, '\n')
    }
    test(name, () => testScalarParse(props))
  }
  test('literal with header', () => testScalarParse({ pre: '\n- ', str: `|+2\n${block}`, expected: block, post: '\n' }))
})

describe("parse single-line plain", () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: 'plain value' }, commonTests[name])
    test(name, () => testScalarParse(props))
  }
  test('escaped', () => testScalarParse({ pre: '', str: '-#:] ,', post: ': ' }))
  test('escaped in flow', () => testScalarParse({ pre: '', str: '-#:', post: '] ,: ', inFlow: true }))
  test('empty', () => testScalarParse({ pre: '- ', str: '', post: ' : ' }))
})

describe("parse multi-line plain", () => {
  const str = ':first#\n      ? :multi line\n  \n      \tplain value'
  for (const name in commonTests) {
    const props = Object.assign({ str }, commonTests[name])
    if (props.comment) {
      props.str = props.str.replace(/^.*/, '')
      props.expected = props.str.replace(/^\n/, '')
    }
    if (props.post && props.post[0] !== '\n') {
      props.pre = `  ${props.pre}`
      props.post = props.post.replace(/^\s?/, '\n')
    }
    test(name, () => testScalarParse(props))
  }
})
