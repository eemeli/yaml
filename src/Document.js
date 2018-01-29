import { Type } from 'raw-yaml'
import { YAMLReferenceError, YAMLSyntaxError, YAMLWarning } from './errors'
import { DefaultTagPrefixes, DefaultTags } from './Tags'
import { toJSON } from './tags/Collection'

export default class Document {
  parseTagDirective (directive) {
    const [handle, prefix] = directive.parameters
    if (handle && prefix) {
      if (this.tagPrefixes[handle]) this.errors.push(new YAMLSyntaxError(directive,
        'The TAG directive must only be given at most once per handle in the same document.'
      ))
      this.tagPrefixes[handle] = prefix
    } else {
      this.errors.push(new YAMLSyntaxError(directive,
        'Insufficient parameters given for TAG directive'
      ))
    }
  }

  parseYamlDirective (directive) {
    const [version] = directive.parameters
    if (this.version) this.errors.push(new YAMLSyntaxError(directive,
      'The YAML directive must only be given at most once per document.'
    ))
    if (!version) this.errors.push(new YAMLSyntaxError(directive,
      'Insufficient parameters given for YAML directive'
    ))
    else if (version !== '1.2') this.errors.push(new YAMLWarning(directive,
      `Document will be parsed as YAML 1.2 rather than YAML ${version}`
    ))
    this.version = version
  }

  constructor (tags, { directives = [], contents = [] } = {}) {
    this.anchors = []
    this.directives = directives
    this.errors = []
    this.rawContents = contents
    this.tagPrefixes = {}
    this.tags = tags
    this.version = null
    directives.forEach((directive) => {
      const { name } = directive
      switch (name) {
        case 'TAG':
          this.parseTagDirective(directive)
          break
        case 'YAML':
          this.parseYamlDirective(directive)
          break
        default:
          if (name) this.errors.push(new YAMLWarning(directive,
            `YAML 1.2 only supports TAG and YAML directives, and not ${name}`
          ))
      }
    })
    let contentNode = null
    contents.forEach(node => {
      if (!node.valueRange || node.valueRange.isEmpty) return
      if (!contentNode) contentNode = node
      else this.errors.push(new YAMLSyntaxError(node,
        'Document is not valid YAML (bad indentation?)'
      ))
    })
    this.contents = contentNode ? this.resolveNode(contentNode) : null
  }

  toJSON () {
    return toJSON(this.contents)
  }

  resolveTagName (node) {
    const { tag, type } = node
    let nonSpecific = false
    if (tag) {
      const { handle, suffix, verbatim } = tag
      if (verbatim) {
        if (verbatim !== '!' && verbatim !== '!!') return verbatim
        this.errors.push(new YAMLSyntaxError(node,
          `Verbatim tags aren't resolved, so ${verbatim} is invalid.`
        ))
      } else if (handle === '!' && !suffix) {
        nonSpecific = true
      } else {
        const prefix = this.tagPrefixes[handle] || DefaultTagPrefixes[handle]
        if (prefix) {
          if (suffix) return prefix + suffix
          this.errors.push(new YAMLSyntaxError(node,
            `The ${handle} tag has no suffix.`
          ))
        } else {
          this.errors.push(new YAMLSyntaxError(node,
            `The ${handle} tag handle is non-default and was not declared.`
          ))
        }
      }
    }
    switch (type) {
      case Type.BLOCK_FOLDED:
      case Type.BLOCK_LITERAL:
      case Type.QUOTE_DOUBLE:
      case Type.QUOTE_SINGLE:
        return DefaultTags.STR
      case Type.FLOW_MAP:
      case Type.MAP:
        return DefaultTags.MAP
      case Type.FLOW_SEQ:
      case Type.SEQ:
        return DefaultTags.SEQ
      case Type.PLAIN:
        return nonSpecific ? DefaultTags.STR : null
      default:
        return null
    }
  }

  resolveNode (node) {
    if (!node) return null
    const { anchors, errors, tags } = this
    const anchor = node.anchor
    if (anchor) anchors[anchor] = node
    if (node.type === Type.ALIAS) {
      const src = anchors[node.rawValue]
      if (src) return node.resolved = src.resolved
      errors.push(new YAMLReferenceError(node, `Aliased anchor not found: ${node.rawValue}`))
      return null
    }
    const tagName = this.resolveTagName(node)
    if (tagName) return node.resolved = tags.resolve(this, node, tagName)
    if (node.type === Type.PLAIN) return node.resolved = tags.resolveScalar(node.strValue || '')
    errors.push(new YAMLSyntaxError(node, `Failed to resolve ${node.type} node here`))
    return null
  }
}
