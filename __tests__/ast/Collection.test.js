import Node from '../../src/ast/Node'
import { cleanForSnapshot, commonTests, testParse } from './common'
import parseNode from '../../src/ast/parseNode'

describe('simple collections', () => {
  test('seq', () => {
    const src = `
- one value
- '2' #c1
  #c2
- !tag "three"
-\t>
 four
   five
- [{"six":7}]
#c3`
    const context = {
      indent: 0,
      inFlow: false,
      inCollection: false,
      parent: { type: Node.Type.DOCUMENT },
      src
    }
    const node = parseNode(context, 1)
    expect(node.type).toBe(Node.Type.COLLECTION)
    expect(node.rawValue).toBe(src.slice(1))
    expect(node.range.end).toBe(src.length)
    expect(node.items.length).toBe(7)
    expect(cleanForSnapshot(node)).toMatchSnapshot()
  })
})

describe('custom seq items', () => {
  test('seq in seq in seq', () => testParse({
    pre: '\n',
    str: '-\t-\n    - value',
    post: '',
    test: (node) => expect(node.items[0].item.items[0].item.items[0].item.rawValue).toBe('value')
  }))

  test('building a hierarchy', () => {
    const src = `
- seq
- rows
- -	- h
     i #c1
  - #c2
    #c3
   j #c4

-
 - >+1	#c6
     m
  n
\n\n\n`
    const context = {
      indent: 0,
      inFlow: false,
      inCollection: false,
      parent: { type: Node.Type.DOCUMENT },
      src
    }
    const node = parseNode(context, 1)
    expect(node.type).toBe(Node.Type.COLLECTION)
    expect(node.rawValue).toBe(src.slice(1))
    expect(node.range.end).toBe(src.length)
    expect(node.items.length).toBe(4)
    expect(node.items[2].item.type).toBe(Node.Type.COLLECTION)
    expect(cleanForSnapshot(node)).toMatchSnapshot()
  })
})
