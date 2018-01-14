import { commonTests, testParse } from './common'

describe('parse "quoted"', () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '"value"' }, commonTests[name])
    test(name, () => testParse(props))
  }
  test('without spaces', () => testParse({ pre: '{', str: '"value"', post: ',' }))
  test('multi-line', () => testParse({ pre: '\n', str: '"value\nwith\nmore lines"', post: '\n' }))
  test('escaped', () => testParse({ pre: '\n', str: '" #value\\\\\nwith \\"more\\" lines\\""', post: '\n' }))
})

describe("parse 'quoted'", () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: "'value'" }, commonTests[name])
    test(name, () => testParse(props))
  }
  test('without spaces', () => testParse({ pre: '{', str: "'value'", post: ',' }))
  test('multi-line', () => testParse({ pre: '\n', str: "'value\nwith\nmore lines'", post: '\n' }))
  test('escaped', () => testParse({ pre: '\n', str: "' #value\nwith ''more'' lines'''", post: '\n' }))
})

describe("parse *alias", () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '*alias', expected: 'alias' }, commonTests[name])
    test(name, () => testParse(props))
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
    test(name, () => testParse(props))
  }
  test('literal with header', () => testParse({ pre: '\n- ', str: `|+2\n${block}`, expected: block, post: '\n' }))
})

describe("parse single-line plain", () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: 'plain value' }, commonTests[name])
    test(name, () => testParse(props))
  }
  test('escaped', () => testParse({ pre: '', str: '-#:] ,', post: ': ' }))
  test('escaped in flow', () => testParse({ pre: '', str: '-#:', post: '] ,: ', inFlow: true }))
  test('empty', () => testParse({ pre: '- ', str: '', post: '\n- ' }))
  test('empty in flow', () => testParse({ pre: '{ x: ', str: '', post: ' , ', inFlow: true }))
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
    test(name, () => testParse(props))
  }
})

describe('parse %directives', () => {
  const tag = 'TAG !yaml! tag:yaml.org,2002:'
  test('TAG', () => testParse({ pre: '', post: '\n', str: `%${tag}`, expected: tag }))
  test('YAML with comment', () => testParse({ pre: '', post: '\n', str: '%YAML 1.2', expected: 'YAML 1.2', comment: 'comment' }))
})

describe('parse #comments', () => {
  const comment = 'comment # here!'
  test('bare', () => testParse({ pre: '', str: '', comment, post: '' }))
  test('newline before & after', () => testParse({ pre: '\n', str: '', comment, post: '\n' }))
  test('complex mapping key', () => testParse({ pre: '? ', str: '', comment, post: '\n: ' }))
  test('seq value', () => testParse({ pre: '- ', str: '', comment, post: '\n- ' }))
  test('indented block', () => testParse({ pre: '    - ', str: '', comment, post: '\n  x' }))
})
