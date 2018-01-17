import Node from '../../src/ast/Node'
import { commonTests, testParse } from './common'

describe("parse single-line plain", () => {
  const type = Node.Type.PLAIN
  for (const name in commonTests) {
    const props = Object.assign({ str: 'plain value', type }, commonTests[name])
    test(name, () => testParse(props))
  }
  test('escaped', () => testParse({ pre: '', str: '-#:] ,', post: ': ', type }))
  test('escaped in flow', () => testParse({ pre: '', str: '-#:', post: '] ,: ', inFlow: true, type }))
  test('empty', () => testParse({ pre: '- ', str: '', post: '\n- ', type }))
  test('empty in flow', () => testParse({ pre: '{ x: ', str: '', post: ' , ', inFlow: true, type }))
})

describe("parse multi-line plain", () => {
  const str = ':first#\n      ? :multi line\n  \n      \tplain value'
  const type = Node.Type.PLAIN
  for (const name in commonTests) {
    const props = Object.assign({ str, type }, commonTests[name])
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

describe('parse #comments', () => {
  const comment = 'comment # here!'
  test('bare', () => testParse({ pre: '', str: '', comment, post: '' }))
  test('newline before & after', () => testParse({ pre: '\n', str: '', comment, post: '\n' }))
  test('complex mapping key', () => testParse({ pre: '? ', str: '', comment, post: '\n: ' }))
  test('seq value', () => testParse({ pre: '- ', str: '', comment, post: '\n- ' }))
  test('indented block', () => testParse({ pre: '    - ', str: '', comment, post: '\n  x' }))
})
