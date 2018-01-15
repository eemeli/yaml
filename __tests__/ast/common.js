import CollectionItem from '../../src/ast/CollectionItem'
import Document from '../../src/ast/Document'
import Node from '../../src/ast/Node'
import Range from '../../src/ast/Range';
import Scalar from '../../src/ast/Scalar'

export const cleanForSnapshot = (node) => {
  if (node instanceof Node) {
    if (node.items) node.items.forEach(cleanForSnapshot)
    else if (node.item) cleanForSnapshot(node.item)
    else node.raw = node.rawValue
    if (node.commentRange) node.rawComment = node.comment
    for (const key in node) if (node[key] == null) delete node[key]
    delete node.doc
  }
  return node
}

export const testParse = ({ pre, post, str, comment, expected, inFlow, startIdx, test: customTest }) => {
  let body = str
  if (comment) {
    const lines = body.split('\n')
    lines[0] += ` #${comment}`
    body = lines.join('\n')
    if (!expected && lines.some((line, i) => i > 0 && /\S/.test(line))) {
      expected = body
    }
  }
  const doc = new Document(pre + body + post)
  const indent = Node.endOfIndent(doc.src, 0)
  const node = doc.parseNode(startIdx || pre.length, indent, inFlow || false)
  expect(node.rawValue).toBe(expected || str)
  const expectedEnd = Node.endOfWhiteSpace(doc.src, pre.length + body.length)
  expect(node.range.end).toBe(expectedEnd)
  if (comment) {
    if (node instanceof Scalar) {
      expect(node.comment).toBe(comment)
    } else if (node instanceof CollectionItem) {
      expect(node.comment || node.item.comment).toBe(comment)
    }
  }
  if (customTest) customTest(node)
  expect(cleanForSnapshot(node)).toMatchSnapshot()
}

export const commonTests = {
  'bare': { pre: '', post: '' },
  'newline before & after': { pre: '\n', post: '\n' },
  'complex mapping key': { pre: '? ', post: ' : ' },
  'seq value': { pre: '- ', post: '\n- ' },
  'indented block': { pre: '    - ', post: '\n  x' },
  'flow seq value': { pre: '[ ', post: ' ]', inFlow: true },
  'with comment': { pre: '\n  ', comment: 'comment # here!', post: '\n' },
  'with props': { pre: '- !tag! &anchor ', post: '\n- ', startIdx: 2, test: (node) => {
    expect(node.anchor).toBe('anchor')
    expect(node.tag).toBe('tag!')
  } }
}

