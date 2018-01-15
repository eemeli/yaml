import Collection from '../../src/ast/Collection'
import Document from '../../src/ast/Document'
import Node from '../../src/ast/Node'
import { cleanForSnapshot } from './common'

describe.only('simple collections', () => {
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
    const node = new Collection(doc, { type: Node.Type.COLLECTION })
    const end = node.parse(0, 0, false)
    expect(node.rawValue).toBe(seq)
    expect(end).toBe(seq.length)
    expect(node.items.length).toBe(7)
    expect(cleanForSnapshot(node)).toMatchSnapshot()
  })
})
