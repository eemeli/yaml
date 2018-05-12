import addComment from './addComment'
import { Char, Type } from './ast/Node'
import { YAMLReferenceError, YAMLSyntaxError, YAMLWarning } from './errors'
import resolveValue from './resolveValue'
import Tags, { DefaultTagPrefixes, DefaultTags } from './Tags'
import Collection, { toJSON } from './schema/Collection'

const isCollectionItem = (node) => node && [Type.MAP_KEY, Type.MAP_VALUE, Type.SEQ_ITEM].includes(node.type)

export default class Document {
  constructor (tags, options = {}) {
    this.anchors = []
    this.commentBefore = null
    this.comment = null
    this.contents = null
    this.directives = []
    this.errors = []
    this.options = options.merge ? { merge: options.merge } : {}
    this.rawContents = null
    this.tagPrefixes = {}
    this.tags = tags || new Tags(options)
    this.version = null
    this.warnings = []
  }

  parse ({ directives = [], contents = [], error }) {
    this.directives = directives
    if (error) {
      if (!error.source) error.source = this
      this.errors.push(error)
    }
    this.rawContents = contents
    const directiveComments = []
    directives.forEach((directive) => {
      const { comment, name } = directive
      switch (name) {
        case 'TAG':
          this.resolveTagDirective(directive)
          break
        case 'YAML':
          this.resolveYamlDirective(directive)
          break
        default:
          if (name) this.warnings.push(new YAMLWarning(directive,
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
        if (this.contents) {
          const cb = comments.before.join('\n') || null
          if (cb) {
            const cbNode = this.contents instanceof Collection && this.contents.items[0]
              ? this.contents.items[0]
              : this.contents
            cbNode.commentBefore = cbNode.commentBefore
              ? `${cb}\n${cbNode.commentBefore}`
              : cb
          }
        } else {
          comments.after = comments.before.concat(comments.after)
        }
        break
      default:
        this.errors.push(new YAMLSyntaxError(null,
          'Document is not valid YAML (bad indentation?)'))
        this.contents = contentNodes
        if (this.contents[0]) this.contents[0].commentBefore = comments.before.join('\n') || null
        else comments.after = comments.before.concat(comments.after)
    }
    this.comment = comments.after.join('\n') || null
    return this
  }

  resolveTagDirective (directive) {
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

  resolveYamlDirective (directive) {
    const [version] = directive.parameters
    if (this.version) this.errors.push(new YAMLSyntaxError(directive,
      'The YAML directive must only be given at most once per document.'
    ))
    if (!version) this.errors.push(new YAMLSyntaxError(directive,
      'Insufficient parameters given for YAML directive'
    ))
    else if (version !== '1.2') this.warnings.push(new YAMLWarning(directive,
      `Document will be parsed as YAML 1.2 rather than YAML ${version}`
    ))
    this.version = version
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
    const comments = { before: [], after: [] }
    const props = isCollectionItem(node.context.parent)
      ? node.context.parent.props.concat(node.props)
      : node.props
    props.forEach(({ start, end }, i) => {
      switch (node.context.src[start]) {
        case Char.COMMENT:
          if (!node.commentHasRequiredWhitespace(start)) errors.push(new YAMLSyntaxError(node,
            'Comments must be separated from other tokens by white space characters'))
          const c = node.context.src.slice(start + 1, end)
          const { header, valueRange } = node
          if (valueRange && (start > valueRange.start || (header && start > header.start))) {
            comments.after.push(c)
          } else {
            comments.before.push(c)
          }
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
    let res
    if (node.type === Type.ALIAS) {
      if (hasAnchor || hasTag) errors.push(new YAMLSyntaxError(node,
        'An alias node must not specify any properties'))
      const src = anchors[node.rawValue]
      if (!src) {
        errors.push(new YAMLReferenceError(node, `Aliased anchor not found: ${node.rawValue}`))
        return null
      }
      res = src.resolved
    } else {
      const tagName = this.resolveTagName(node)
      if (tagName) {
        res = tags.resolveNodeWithFallback(this, node, tagName)
      } else {
        if (node.type !== Type.PLAIN) {
          errors.push(new YAMLSyntaxError(node, `Failed to resolve ${node.type} node here`))
          return null
        }
        try {
          res = tags.resolveScalar(node.strValue || '')
        } catch (error) {
          if (!error.source) error.source = node
          errors.push(error)
          return null
        }
      }
    }
    if (res) {
      const cb = comments.before.join('\n')
      if (cb) res.commentBefore = res.commentBefore ? `${res.commentBefore}\n${cb}` : cb
      const ca = comments.after.join('\n')
      if (ca) res.comment = res.comment ? `${res.comment}\n${ca}` : ca
    }
    return node.resolved = res
  }

  setContents (value, wrapScalars) {
    this.contents = resolveValue(this, value, wrapScalars)
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
