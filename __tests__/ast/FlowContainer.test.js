import { commonTests, testParse } from './common'

describe('parse simple array', () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '[ "one", 2, three four ]' }, commonTests[name])
    test(name, () => testParse(props))
  }
})

describe('parse deep array', () => {
  const str = `[ "one", 2,
    three four,
[five, \t"6,"] ]`
  const itemTest = (node) => expect(node.items[7].items[3].rawValue).toBe('"6,"')
  for (const name in commonTests) {
    const props = Object.assign({ str, test: itemTest }, commonTests[name])
    if (props.comment) props.test = (node) => {
      expect(node.items.some(n => n.comment === props.comment))
      expect(node.items[8].items[3].rawValue).toBe('"6,"')
    }
    test(name, () => testParse(props))
  }
})

describe('parse simple object', () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '{ "first":"one", 2, three: four,?fi:ve }' }, commonTests[name])
    test(name, () => testParse(props))
  }
})
