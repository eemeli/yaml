import addComment from './addComment'
import listTagNames from './listTagNames'
import { Char, Type } from './cst/Node'
import {
  YAMLReferenceError,
  YAMLSemanticError,
  YAMLSyntaxError,
  YAMLWarning
} from './errors'
import Schema, { DefaultTagPrefixes, DefaultTags } from './schema'
import Collection from './schema/Collection'
import toJSON from './toJSON'

const isCollectionItem = node =>
  node && [Type.MAP_KEY, Type.MAP_VALUE, Type.SEQ_ITEM].includes(node.type)

export default class Document {
  constructor(schema) {
    this.anchors = {}
    this.commentBefore = null
    this.comment = null
    this.contents = null
    this.errors = []
    this.tagPrefixes = []
    this.schema = schema instanceof Schema ? schema : new Schema(schema)
    this.version = null
    this.warnings = []
  }

  parse({ directives = [], contents = [], error }) {
    if (error) {
      if (!error.source) error.source = this
      this.errors.push(error)
    }
    const directiveComments = []
    directives.forEach(directive => {
      const { comment, name } = directive
      switch (name) {
        case 'TAG':
          this.resolveTagDirective(directive)
          break
        case 'YAML':
          this.resolveYamlDirective(directive)
          break
        default:
          if (name)
            this.warnings.push(
              new YAMLWarning(
                directive,
                `YAML 1.2 only supports %TAG and %YAML directives, and not %${name}`
              )
            )
      }
      if (comment) directiveComments.push(comment)
    })
    this.commentBefore = directiveComments.join('\n') || null
    const comments = { before: [], after: [] }
    const contentNodes = []
    contents.forEach(node => {
      if (node.valueRange && !node.valueRange.isEmpty) {
        if (contentNodes.length === 1) {
          this.errors.push(
            new YAMLSyntaxError(
              node,
              'Document is not valid YAML (bad indentation?)'
            )
          )
        }
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
            const cbNode =
              this.contents instanceof Collection && this.contents.items[0]
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
        this.contents = contentNodes
        if (this.contents[0]) {
          this.contents[0].commentBefore = comments.before.join('\n') || null
        } else {
          comments.after = comments.before.concat(comments.after)
        }
    }
    this.comment = comments.after.join('\n') || null
    return this
  }

  resolveTagDirective(directive) {
    const [handle, prefix] = directive.parameters
    if (handle && prefix) {
      if (this.tagPrefixes.every(p => p.handle !== handle)) {
        this.tagPrefixes.push({ handle, prefix })
      } else {
        this.errors.push(
          new YAMLSemanticError(
            directive,
            'The %TAG directive must only be given at most once per handle in the same document.'
          )
        )
      }
    } else {
      this.errors.push(
        new YAMLSemanticError(
          directive,
          'Insufficient parameters given for %TAG directive'
        )
      )
    }
  }

  resolveYamlDirective(directive) {
    const [version] = directive.parameters
    if (this.version)
      this.errors.push(
        new YAMLSemanticError(
          directive,
          'The %YAML directive must only be given at most once per document.'
        )
      )
    if (!version)
      this.errors.push(
        new YAMLSemanticError(
          directive,
          'Insufficient parameters given for %YAML directive'
        )
      )
    else if (version !== '1.2')
      this.warnings.push(
        new YAMLWarning(
          directive,
          `Document will be parsed as YAML 1.2 rather than YAML ${version}`
        )
      )
    this.version = version
  }

  resolveTagName(node) {
    const { tag, type } = node
    let nonSpecific = false
    if (tag) {
      const { handle, suffix, verbatim } = tag
      if (verbatim) {
        if (verbatim !== '!' && verbatim !== '!!') return verbatim
        this.errors.push(
          new YAMLSemanticError(
            node,
            `Verbatim tags aren't resolved, so ${verbatim} is invalid.`
          )
        )
      } else if (handle === '!' && !suffix) {
        nonSpecific = true
      } else {
        const prefix =
          this.tagPrefixes.find(p => p.handle === handle) ||
          DefaultTagPrefixes.find(p => p.handle === handle)
        if (prefix) {
          if (suffix) return prefix.prefix + suffix
          this.errors.push(
            new YAMLSemanticError(node, `The ${handle} tag has no suffix.`)
          )
        } else {
          this.errors.push(
            new YAMLSemanticError(
              node,
              `The ${handle} tag handle is non-default and was not declared.`
            )
          )
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

  resolveNode(node) {
    if (!node) return null
    const { anchors, errors, schema } = this
    let hasAnchor = false
    let hasTag = false
    const comments = { before: [], after: [] }
    const props = isCollectionItem(node.context.parent)
      ? node.context.parent.props.concat(node.props)
      : node.props
    props.forEach(({ start, end }, i) => {
      switch (node.context.src[start]) {
        case Char.COMMENT:
          if (!node.commentHasRequiredWhitespace(start))
            errors.push(
              new YAMLSemanticError(
                node,
                'Comments must be separated from other tokens by white space characters'
              )
            )
          const c = node.context.src.slice(start + 1, end)
          const { header, valueRange } = node
          if (
            valueRange &&
            (start > valueRange.start || (header && start > header.start))
          ) {
            comments.after.push(c)
          } else {
            comments.before.push(c)
          }
          break
        case Char.ANCHOR:
          if (hasAnchor)
            errors.push(
              new YAMLSemanticError(node, 'A node can have at most one anchor')
            )
          hasAnchor = true
          break
        case Char.TAG:
          if (hasTag)
            errors.push(
              new YAMLSemanticError(node, 'A node can have at most one tag')
            )
          hasTag = true
          break
      }
    })
    if (hasAnchor) anchors[node.anchor] = node
    let res
    if (node.type === Type.ALIAS) {
      if (hasAnchor || hasTag)
        errors.push(
          new YAMLSemanticError(
            node,
            'An alias node must not specify any properties'
          )
        )
      const src = anchors[node.rawValue]
      if (!src) {
        errors.push(
          new YAMLReferenceError(
            node,
            `Aliased anchor not found: ${node.rawValue}`
          )
        )
        return null
      }
      res = src.resolved
    } else {
      const tagName = this.resolveTagName(node)
      if (tagName) {
        res = schema.resolveNodeWithFallback(this, node, tagName)
      } else {
        if (node.type !== Type.PLAIN) {
          errors.push(
            new YAMLSyntaxError(
              node,
              `Failed to resolve ${node.type} node here`
            )
          )
          return null
        }
        try {
          res = schema.resolveScalar(node.strValue || '')
        } catch (error) {
          if (!error.source) error.source = node
          errors.push(error)
          return null
        }
      }
    }
    if (res) {
      res.range = [node.range.start, node.range.end]
      const cb = comments.before.join('\n')
      if (cb) {
        res.commentBefore = res.commentBefore
          ? `${res.commentBefore}\n${cb}`
          : cb
      }
      const ca = comments.after.join('\n')
      if (ca) res.comment = res.comment ? `${res.comment}\n${ca}` : ca
    }
    return (node.resolved = res)
  }

  listNonDefaultTags() {
    const { prefix } = DefaultTagPrefixes.find(p => p.handle === '!!')
    return listTagNames(this.contents).filter(t => t.indexOf(prefix) !== 0)
  }

  setTagPrefix(handle, prefix) {
    if (handle[0] !== '!' || handle[handle.length - 1] !== '!')
      throw new Error('Handle must start and end with !')
    if (prefix) {
      const prev = this.tagPrefixes.find(p => p.handle === handle)
      if (prev) prev.prefix = prefix
      else this.tagPrefixes.push({ handle, prefix })
    } else {
      this.tagPrefixes = this.tagPrefixes.filter(p => p.handle !== handle)
    }
  }

  toJSON() {
    return toJSON(this.contents)
  }

  toString() {
    if (this.errors.length > 0)
      throw new Error('Document with errors cannot be stringified')
    const lines = []
    if (this.commentBefore) lines.push(this.commentBefore.replace(/^/gm, '#'))
    let hasDirectives = false
    if (this.version) {
      lines.push('%YAML 1.2')
      hasDirectives = true
    }
    const tagNames = this.listNonDefaultTags()
    this.tagPrefixes.forEach(({ handle, prefix }) => {
      if (tagNames.some(t => t.indexOf(prefix) === 0)) {
        lines.push(`%TAG ${handle} ${prefix}`)
        hasDirectives = true
      }
    })
    if (hasDirectives) lines.push('---')
    const ctx = {
      doc: this,
      indent: ''
    }
    if (this.contents) {
      if (this.contents.commentBefore)
        lines.push(this.contents.commentBefore.replace(/^/gm, '#'))
      // top-level block scalars need to be indented if followed by a comment
      ctx.forceBlockIndent = !!this.comment
      let comment = this.contents.comment
      const body = this.schema.stringify(this.contents, ctx, () => {
        comment = null
      })
      lines.push(addComment(body, '', comment))
    } else if (this.contents !== undefined) {
      lines.push(this.schema.stringify(this.contents, ctx))
    }
    if (this.comment) lines.push(this.comment.replace(/^/gm, '#'))
    return lines.join('\n') + '\n'
  }
}
