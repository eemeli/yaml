import { Char, Type } from './ast/Node'
import { YAMLReferenceError, YAMLSyntaxError, YAMLWarning } from './errors'
import { DefaultTagPrefixes, DefaultTags } from './Tags'
import { toJSON } from './schema/Collection'
import { addComment } from './schema/Node'

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

  constructor (tags, { directives = [], contents = [], error } = {}, { merge } = {}) {
    this.anchors = []
    this.directives = directives
    this.errors = []
    if (error) {
      if (!error.source) error.source = this
      this.errors.push(error)
    }
    this.options = { merge }
    this.rawContents = contents
    this.tagPrefixes = {}
    this.tags = tags
    this.version = null
    const directiveComments = []
    directives.forEach((directive) => {
      const { comment, name } = directive
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
      if (comment) directiveComments.push(comment)
    })
    this.commentBefore = directiveComments.join('\n') || null
    const comments = { before: [], after: [] }
    const contentNodes = []
    contents.forEach((node) => {
      if (node.valueRange && !node.valueRange.isEmpty) {
        contentNodes.push(this.resolveNode(node))
      } else if (node.comment) {
        const cc = contentNodes.length === 0 ? comments.before : comments.after
        cc.push(node.comment)
      }
    })
    switch (contentNodes.length) {
      case 0:
        this.contents = null
        comments.after = comments.before
        break
      case 1:
        this.contents = contentNodes[0]
        if (this.contents) this.contents.commentBefore = comments.before.join('\n') || null
        else comments.after = comments.before.concat(comments.after)
        break
      default:
        this.errors.push(new YAMLSyntaxError(null,
          'Document is not valid YAML (bad indentation?)'))
        this.contents = contentNodes
        if (this.contents[0]) this.contents[0].commentBefore = comments.before.join('\n') || null
        else comments.after = comments.before.concat(comments.after)
    }
    this.comment = comments.after.join('\n') || null
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
    let hasAnchor = false
    let hasTag = false
    node.props.forEach(({ start, end }) => {
      switch (node.context.src[start]) {
        case Char.COMMENT:
          if (!node.commentHasRequiredWhitespace(start)) errors.push(new YAMLSyntaxError(node,
            'Comments must be separated from other tokens by white space characters'))
          break
        case Char.ANCHOR:
          if (hasAnchor) errors.push(new YAMLSyntaxError(node,
            'A node can have at most one anchor'))
          hasAnchor = true
          break
        case Char.TAG:
          if (hasTag) errors.push(new YAMLSyntaxError(node,
            'A node can have at most one tag'))
          hasTag = true
          break
      }
    })
    if (hasAnchor) anchors[node.anchor] = node
    if (node.type === Type.ALIAS) {
      if (hasAnchor || hasTag) errors.push(new YAMLSyntaxError(node,
        'An alias node must not specify any properties'))
      const src = anchors[node.rawValue]
      if (src) return node.resolved = src.resolved
      errors.push(new YAMLReferenceError(node, `Aliased anchor not found: ${node.rawValue}`))
      return null
    }
    const tagName = this.resolveTagName(node)
    if (tagName) return node.resolved = tags.resolve(this, node, tagName)
    if (node.type === Type.PLAIN) try {
      return node.resolved = tags.resolveScalar(node.strValue || '')
    } catch (error) {
      if (!error.source) error.source = node
      errors.push(error)
      return null
    }
    errors.push(new YAMLSyntaxError(node, `Failed to resolve ${node.type} node here`))
    return null
  }

  toJSON () {
    return toJSON(this.contents)
  }

  toString () {
    let { contents } = this
    if (Array.isArray(contents)) {
      if (contents.length <= 1) contents = contents[0] || null
      else throw new Error('Document with multiple content nodes cannot be stringified')
    }
    const lines = this.directives
      .filter(({ comment }) => comment)
      .map(({ comment }) => comment.replace(/^/gm, '#'))
    let hasDirectives = false
    if (this.version) {
      lines.push('%YAML 1.2')
      hasDirectives = true
    }
    Object.keys(this.tagPrefixes).forEach((handle) => {
      const prefix = this.tagPrefixes[handle]
      lines.push(`%TAG ${handle} ${prefix}`)
      hasDirectives = true
    })
    if (hasDirectives) lines.push('---')
    if (contents) {
      if (contents.commentBefore) lines.push(contents.commentBefore.replace(/^/gm, '#'))
      const options = {
        // top-level block scalars need to be indented if followed by a comment
        forceBlockIndent: !!this.comment,
        indent: ''
      }
      let comment = contents.comment
      const body = this.tags.stringify(contents, options, () => { comment = null })
      lines.push(addComment(body, '', comment))
    }
    if (this.comment) lines.push(this.comment.replace(/^/gm, '#'))
    return lines.join('\n') + '\n'
  }
}
