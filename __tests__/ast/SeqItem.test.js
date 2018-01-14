import Node from '../../src/ast/Node'
import { commonTests, testParse } from './common'

describe('parse simple seq items', () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '- "value"' }, commonTests[name])
    test(name, () => testParse(props))
  }
})

const items = {
  '- -plain value': Node.Type.PLAIN,
  '- "multiline\nquote"': Node.Type.DOUBLE,
  '-\t[ 1, 2 ]': Node.Type.FLOW_SEQ,
  '- *alias': Node.Type.ALIAS,
  '- >+2\n       multiple\n       lines': Node.Type.BLOCK,
  '-\n  \n\n    multiline plain': Node.Type.PLAIN
}
for (const str in items) {
  describe(`seq items ${JSON.stringify(str)}`, () => {
    for (const name in commonTests) {
      const props = Object.assign({ str, test: (node) => expect(node.item.type).toBe(items[str]) }, commonTests[name])
      if (items[str] === Node.Type.DOUBLE && props.comment) continue
      if (props.post && props.post[0] !== '\n' && str.indexOf('\n' !== -1)) {
        props.post = props.post.replace(/^\s?/, '\n')
      }
      test(name, () => testParse(props))
    }
  })
}

describe('custom seq items', () => {
  test('seq in seq in seq', () => testParse({
    pre: '\n',
    str: '-\t-\n    - value',
    post: '\n',
    test: (node) => expect(node.item.item.item.rawValue).toBe('value')
  }))
})
