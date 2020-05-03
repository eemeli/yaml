import { Alias } from '../ast/Alias'
import { Char, Type } from '../constants'
import {
  YAMLReferenceError,
  YAMLSemanticError,
  YAMLSyntaxError
} from '../errors'

import { resolveScalar } from './resolveScalar'
import { resolveTagName } from './resolveTagName'
import { resolveTag } from './resolveTag'

const isCollectionItem = node => {
  if (!node) return false
  const { type } = node
  return (
    type === Type.MAP_KEY || type === Type.MAP_VALUE || type === Type.SEQ_ITEM
  )
}

function resolveNodeProps(errors, node) {
  const comments = { before: [], after: [] }
  let hasAnchor = false
  let hasTag = false

  const props = isCollectionItem(node.context.parent)
    ? node.context.parent.props.concat(node.props)
    : node.props
  for (const { start, end } of props) {
    switch (node.context.src[start]) {
      case Char.COMMENT: {
        if (!node.commentHasRequiredWhitespace(start)) {
          const msg =
            'Comments must be separated from other tokens by white space characters'
          errors.push(new YAMLSemanticError(node, msg))
        }
        const { header, valueRange } = node
        const cc =
          valueRange &&
          (start > valueRange.start || (header && start > header.start))
            ? comments.after
            : comments.before
        cc.push(node.context.src.slice(start + 1, end))
        break
      }

      // Actual anchor & tag resolution is handled by schema, here we just complain
      case Char.ANCHOR:
        if (hasAnchor) {
          const msg = 'A node can have at most one anchor'
          errors.push(new YAMLSemanticError(node, msg))
        }
        hasAnchor = true
        break
      case Char.TAG:
        if (hasTag) {
          const msg = 'A node can have at most one tag'
          errors.push(new YAMLSemanticError(node, msg))
        }
        hasTag = true
        break
    }
  }
  return { comments, hasAnchor, hasTag }
}

function resolveNodeValue(doc, node) {
  const { anchors, errors, schema } = doc

  if (node.type === Type.ALIAS) {
    const name = node.rawValue
    const src = anchors.getNode(name)
    if (!src) {
      const msg = `Aliased anchor not found: ${name}`
      errors.push(new YAMLReferenceError(node, msg))
      return null
    }

    // Lazy resolution for circular references
    const res = new Alias(src)
    anchors._cstAliases.push(res)
    return res
  }

  const tagName = resolveTagName(doc, node)
  if (tagName) return resolveTag(doc, node, tagName)

  if (node.type !== Type.PLAIN) {
    const msg = `Failed to resolve ${node.type} node here`
    errors.push(new YAMLSyntaxError(node, msg))
    return null
  }

  try {
    return resolveScalar(
      node.strValue || '',
      schema.tags,
      schema.tags.scalarFallback
    )
  } catch (error) {
    if (!error.source) error.source = node
    errors.push(error)
    return null
  }
}

// sets node.resolved on success
export function resolveNode(doc, node) {
  if (!node) return null
  if (node.error) doc.errors.push(node.error)

  const { comments, hasAnchor, hasTag } = resolveNodeProps(doc.errors, node)
  if (hasAnchor) {
    const { anchors } = doc
    const name = node.anchor
    const prev = anchors.getNode(name)
    // At this point, aliases for any preceding node with the same anchor
    // name have already been resolved, so it may safely be renamed.
    if (prev) anchors.map[anchors.newName(name)] = prev
    // During parsing, we need to store the CST node in anchors.map as
    // anchors need to be available during resolution to allow for
    // circular references.
    anchors.map[name] = node
  }
  if (node.type === Type.ALIAS && (hasAnchor || hasTag)) {
    const msg = 'An alias node must not specify any properties'
    doc.errors.push(new YAMLSemanticError(node, msg))
  }

  const res = resolveNodeValue(doc, node)
  if (res) {
    res.range = [node.range.start, node.range.end]
    if (doc.options.keepCstNodes) res.cstNode = node
    if (doc.options.keepNodeTypes) res.type = node.type
    const cb = comments.before.join('\n')
    if (cb) {
      res.commentBefore = res.commentBefore ? `${res.commentBefore}\n${cb}` : cb
    }
    const ca = comments.after.join('\n')
    if (ca) res.comment = res.comment ? `${res.comment}\n${ca}` : ca
  }

  return (node.resolved = res)
}
