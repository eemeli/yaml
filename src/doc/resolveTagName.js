import { Type } from '../constants'
import { YAMLSemanticError, YAMLWarning } from '../errors'
import { Schema } from './Schema'

function resolveTagHandle(doc, node) {
  const { handle, suffix } = node.tag
  let prefix = doc.tagPrefixes.find(p => p.handle === handle)
  if (!prefix) {
    const dtp = doc.getDefaults().tagPrefixes
    if (dtp) prefix = dtp.find(p => p.handle === handle)
    if (!prefix)
      throw new YAMLSemanticError(
        node,
        `The ${handle} tag handle is non-default and was not declared.`
      )
  }
  if (!suffix)
    throw new YAMLSemanticError(node, `The ${handle} tag has no suffix.`)

  if (handle === '!' && (doc.version || doc.options.version) === '1.0') {
    if (suffix[0] === '^') {
      doc.warnings.push(
        new YAMLWarning(node, 'YAML 1.0 ^ tag expansion is not supported')
      )
      return suffix
    }
    if (/[:/]/.test(suffix)) {
      // word/foo -> tag:word.yaml.org,2002:foo
      const vocab = suffix.match(/^([a-z0-9-]+)\/(.*)/i)
      return vocab
        ? `tag:${vocab[1]}.yaml.org,2002:${vocab[2]}`
        : `tag:${suffix}`
    }
  }

  return prefix.prefix + decodeURIComponent(suffix)
}

export function resolveTagName(doc, node) {
  const { tag, type } = node
  let nonSpecific = false
  if (tag) {
    const { handle, suffix, verbatim } = tag
    if (verbatim) {
      if (verbatim !== '!' && verbatim !== '!!') return verbatim
      const msg = `Verbatim tags aren't resolved, so ${verbatim} is invalid.`
      doc.errors.push(new YAMLSemanticError(node, msg))
    } else if (handle === '!' && !suffix) {
      nonSpecific = true
    } else {
      try {
        return resolveTagHandle(doc, node)
      } catch (error) {
        doc.errors.push(error)
      }
    }
  }

  switch (type) {
    case Type.BLOCK_FOLDED:
    case Type.BLOCK_LITERAL:
    case Type.QUOTE_DOUBLE:
    case Type.QUOTE_SINGLE:
      return Schema.defaultTags.STR
    case Type.FLOW_MAP:
    case Type.MAP:
      return Schema.defaultTags.MAP
    case Type.FLOW_SEQ:
    case Type.SEQ:
      return Schema.defaultTags.SEQ
    case Type.PLAIN:
      return nonSpecific ? Schema.defaultTags.STR : null
    default:
      return null
  }
}
