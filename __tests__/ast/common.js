import CollectionItem from '../../src/ast/CollectionItem'
import Node from '../../src/ast/Node'
import Range from '../../src/ast/Range'
import Scalar from '../../src/ast/Scalar'
import parseNode from '../../src/ast/parseNode'

export const cleanForSnapshot = (node) => {
  if (node instanceof Node) {
    if (node.items) node.items.forEach(cleanForSnapshot)
    else if (node.item) cleanForSnapshot(node.item)
    else node.raw = node.rawValue
    if (node.commentRange) node.rawComment = node.comment
    for (const key in node) if (node[key] == null) delete node[key]
    delete node.context
  }
  return node
}

const lastNodeIsBlockNode = (node) => {
  let lastNode = node
  while (lastNode.item || lastNode.items) {
    lastNode = lastNode.item || lastNode.items[lastNode.items.length - 1]
  }
  const { type } = lastNode
  return type === Node.Type.BLOCK_FOLDED || type === Node.Type.BLOCK_LITERAL ||
    (type === Node.Type.PLAIN && (!lastNode.commentRange || lastNode.commentRange.end < lastNode.valueRange.end))
}

export const testParse = ({
  comment, expected, inCollection, inFlow, pre, post, str, startIdx, test: customTest, type
}) => {
  let body = str
  if (comment) {
    const lines = body.split('\n')
    lines[0] += ` #${comment}`
    body = lines.join('\n')
    if (!expected && lines.some((line, i) => i > 0 && /\S/.test(line))) {
      expected = body
    }
  }
  const src = pre + body + post
  const context = {
    indent: Node.endOfIndent(src, 0),
    inFlow: inFlow || false,
    inCollection: inCollection || false,
    src
  }
  const node = parseNode(context, startIdx || pre.length)
  let expectedRawValue = expected || str
  let expectedRangeEnd = Node.endOfWhiteSpace(src, pre.length + body.length)
  if (lastNodeIsBlockNode(node)) {
    while (src[expectedRangeEnd] === '\n') {
      expectedRawValue += '\n'
      expectedRangeEnd += 1
    }
  }
  if (node.type === Node.Type.PLAIN) expectedRawValue = expectedRawValue.trim()
  expect(node.rawValue).toBe(expectedRawValue)
  expect(node.range.end).toBe(expectedRangeEnd)
  if (type) expect(node.type).toBe(type)
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

