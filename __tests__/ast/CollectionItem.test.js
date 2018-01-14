import Node from '../../src/ast/Node'
import { commonTests, testParse } from './common'

const simple = {
  'parse simple seq items': '- "value"',
  'parse simple map keys': '? "value"',
  'parse simple map values': ': "value"'
}
for (const dscName in simple) {
  const str = simple[dscName]
  describe(dscName, () => {
    for (const name in commonTests) {
      const props = Object.assign({ str }, commonTests[name])
      test(name, () => testParse(props))
    }
  })
}

const indicators = {
  'seq item': '-',
  'map key': '?',
  'map value': ':'
}
const items = {
  ' -plain value': Node.Type.PLAIN,
  ' "multiline\nquote"': Node.Type.DOUBLE,
  '\t[ 1, 2 ]': Node.Type.FLOW_SEQ,
  ' *alias': Node.Type.ALIAS,
  ' >+2\n       multiple\n       lines': Node.Type.BLOCK,
  '\n  \n\n    multiline plain': Node.Type.PLAIN
}
for (const namePrefix in indicators) {
  const indicator = indicators[namePrefix]
  for (const item in items) {
    const str = indicator + item
    const expType = items[item]
    const typeTest = (node) => expect(node.item.type).toBe(expType)
    describe(`${namePrefix} ${JSON.stringify(str)}`, () => {
      for (const name in commonTests) {
        const props = Object.assign({ str, test: typeTest }, commonTests[name])
        if (expType === Node.Type.DOUBLE && props.comment) continue
        if (props.post && props.post[0] !== '\n' && str.indexOf('\n' !== -1)) {
          props.post = props.post.replace(/^\s?/, '\n')
        }
        test(name, () => testParse(props))
      }
    })
  }
}

describe('custom seq items', () => {
  test('seq in seq in seq', () => testParse({
    pre: '\n',
    str: '-\t-\n    - value',
    post: '\n',
    test: (node) => expect(node.item.item.item.rawValue).toBe('value')
  }))
})
