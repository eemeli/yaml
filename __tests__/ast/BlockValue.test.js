import { commonTests, testParse } from './common'

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
