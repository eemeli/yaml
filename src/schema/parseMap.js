import { Type } from '../ast/Node'
import { YAMLSemanticError, YAMLSyntaxError } from '../errors'
import Map from './Map'
import Pair from './Pair'
import { checkKeyLength, resolveComments } from './parseUtils'
import YAMLSeq from './Seq'

export default function parseMap(doc, ast) {
  const { comments, items } =
    ast.type === Type.FLOW_MAP
      ? resolveFlowMapItems(doc, ast)
      : resolveBlockMapItems(doc, ast)
  const map = new Map()
  map.items = items
  resolveComments(map, comments)
  for (let i = 0; i < items.length; ++i) {
    const { key: iKey } = items[i]
    for (let j = i + 1; j < items.length; ++j) {
      const { key: jKey } = items[j]
      if (
        iKey === jKey ||
        (iKey &&
          jKey &&
          iKey.hasOwnProperty('value') &&
          iKey.value === jKey.value)
      ) {
        doc.errors.push(
          new YAMLSemanticError(
            ast,
            `Map keys must be unique; "${iKey}" is repeated`
          )
        )
        break
      }
    }
    if (doc.schema.merge && iKey.value === '<<') {
      const src = items[i].value
      const srcItems =
        src instanceof YAMLSeq
          ? src.items.reduce((acc, { items }) => acc.concat(items), [])
          : src.items
      const toAdd = srcItems.reduce((toAdd, pair) => {
        const exists =
          items.some(({ key }) => key.value === pair.key.value) ||
          toAdd.some(({ key }) => key.value === pair.key.value)
        return exists ? toAdd : toAdd.concat(pair)
      }, [])
      Array.prototype.splice.apply(items, [i, 1, ...toAdd])
      i += toAdd.length - 1
    }
  }
  ast.resolved = map
  return map
}

function resolveBlockMapItems(doc, ast) {
  const comments = []
  const items = []
  let key = undefined
  let keyStart = null
  for (let i = 0; i < ast.items.length; ++i) {
    const item = ast.items[i]
    switch (item.type) {
      case Type.COMMENT:
        comments.push({ comment: item.comment, before: items.length })
        break
      case Type.MAP_KEY:
        if (key !== undefined) items.push(new Pair(key))
        if (item.error) doc.errors.push(item.error)
        key = doc.resolveNode(item.node)
        keyStart = null
        break
      case Type.MAP_VALUE:
        if (key === undefined) key = null
        if (item.error) doc.errors.push(item.error)
        if (
          !item.context.atLineStart &&
          item.node &&
          item.node.type === Type.MAP &&
          !item.node.context.atLineStart
        ) {
          doc.errors.push(
            new YAMLSemanticError(
              item.node,
              'Nested mappings are not allowed in compact mappings'
            )
          )
        }
        items.push(new Pair(key, doc.resolveNode(item.node)))
        checkKeyLength(doc.errors, ast, i, key, keyStart)
        key = undefined
        keyStart = null
        break
      default:
        if (key !== undefined) items.push(new Pair(key))
        key = doc.resolveNode(item)
        keyStart = item.range.start
        const nextItem = ast.items[i + 1]
        if (!nextItem || nextItem.type !== Type.MAP_VALUE)
          doc.errors.push(
            new YAMLSemanticError(
              item,
              'Implicit map keys need to be followed by map values'
            )
          )
        if (item.valueRangeContainsNewline)
          doc.errors.push(
            new YAMLSemanticError(
              item,
              'Implicit map keys need to be on a single line'
            )
          )
    }
  }
  if (key !== undefined) items.push(new Pair(key))
  return { comments, items }
}

function resolveFlowMapItems(doc, ast) {
  const comments = []
  const items = []
  let key = undefined
  let keyStart = null
  let explicitKey = false
  let next = '{'
  for (let i = 0; i < ast.items.length; ++i) {
    checkKeyLength(doc.errors, ast, i, key, keyStart)
    const item = ast.items[i]
    if (typeof item === 'string') {
      if (item === '?' && key === undefined && !explicitKey) {
        explicitKey = true
        next = ':'
        continue
      }
      if (item === ':') {
        if (key === undefined) key = null
        if (next === ':') {
          next = ','
          continue
        }
      } else {
        if (explicitKey) {
          if (key === undefined && item !== ',') key = null
          explicitKey = false
        }
        if (key !== undefined) {
          items.push(new Pair(key))
          key = undefined
          keyStart = null
          if (item === ',') {
            next = ':'
            continue
          }
        }
      }
      if (item === '}') {
        if (i === ast.items.length - 1) continue
      } else if (item === next) {
        next = ':'
        continue
      }
      doc.errors.push(
        new YAMLSyntaxError(ast, `Flow map contains an unexpected ${item}`)
      )
    } else if (item.type === Type.COMMENT) {
      comments.push({ comment: item.comment, before: items.length })
    } else if (key === undefined) {
      if (next === ',')
        doc.errors.push(
          new YAMLSemanticError(item, 'Separator , missing in flow map')
        )
      key = doc.resolveNode(item)
      keyStart = explicitKey ? null : item.range.start
      // TODO: add error for non-explicit multiline plain key
    } else {
      if (next !== ',')
        doc.errors.push(
          new YAMLSemanticError(item, 'Indicator : missing in flow map entry')
        )
      items.push(new Pair(key, doc.resolveNode(item)))
      key = undefined
      explicitKey = false
    }
  }
  if (ast.items[ast.items.length - 1] !== '}')
    doc.errors.push(
      new YAMLSemanticError(ast, 'Expected flow map to end with }')
    )
  if (key !== undefined) items.push(new Pair(key))
  return { comments, items }
}
