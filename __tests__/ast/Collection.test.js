import Collection from '../../src/ast/Collection'
import Document from '../../src/ast/Document'
import Node from '../../src/ast/Node'
import { cleanForSnapshot, commonTests, testParse } from './common'

describe('simple collections', () => {
  test('seq', () => {
    const seq = `
- one value
- '2' #c1
  #c2
- !tag "three"
-\t>
 four
   five
- [{"six":7}]
#c3`
    const doc = new Document(seq)
    const node = doc.parseNode(1, 0, false, false)
    expect(node.type).toBe(Node.Type.COLLECTION)
    expect(node.rawValue).toBe(seq.slice(1))
    expect(node.range.end).toBe(seq.length)
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
    const tree = `
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
    const doc = new Document(tree)
    const node = doc.parseNode(1, 0, false, false)
    expect(node.type).toBe(Node.Type.COLLECTION)
    expect(node.rawValue).toBe(tree.slice(1))
    expect(node.range.end).toBe(tree.length)
    expect(node.items.length).toBe(4)
    expect(node.items[2].item.type).toBe(Node.Type.COLLECTION)
    expect(cleanForSnapshot(node)).toMatchSnapshot()
  })
})
