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

/*
describe('parse %directives', () => {
  const tag = 'TAG !yaml! tag:yaml.org,2002:'
  test('TAG', () => testParse({ pre: '', post: '\n', str: `%${tag}`, expected: tag }))
  test('YAML with comment', () => testParse({ pre: '', post: '\n', str: '%YAML 1.2', expected: 'YAML 1.2', comment: 'comment' }))
})
*/
