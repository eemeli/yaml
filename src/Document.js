import addComment from './addComment'
import Anchors from './Anchors'
import { Char, Type } from './cst/Node'
import {
  YAMLReferenceError,
  YAMLSemanticError,
  YAMLSyntaxError,
  YAMLWarning
} from './errors'
import listTagNames from './listTagNames'
import Schema, { defaultPrefix, DefaultTags } from './schema'
import Alias from './schema/Alias'
import Collection from './schema/Collection'
import toJSON from './toJSON'

const isCollectionItem = node =>
  node && [Type.MAP_KEY, Type.MAP_VALUE, Type.SEQ_ITEM].includes(node.type)

export default class Document {
  static defaults = {
    '1.0': {
      schema: 'yaml-1.1',
      merge: true,
      tagPrefixes: [
        { handle: '!', prefix: defaultPrefix },
        { handle: '!!', prefix: 'tag:private.yaml.org,2002:' }
      ]
    },
    '1.1': {
      schema: 'yaml-1.1',
      merge: true,
      tagPrefixes: [
        { handle: '!', prefix: '!' },
        { handle: '!!', prefix: defaultPrefix }
      ]
    },
    '1.2': {
      schema: 'core',
      merge: false,
      tagPrefixes: [
        { handle: '!', prefix: '!' },
        { handle: '!!', prefix: defaultPrefix }
      ]
    }
  }

  constructor(options) {
    this.anchors = new Anchors()
    this.commentBefore = null
    this.comment = null
    this.contents = null
    this.errors = []
    this.options = options
    this.schema = null
    this.tagPrefixes = []
    this.version = null
    this.warnings = []
  }

  getDefaults() {
    return (
      Document.defaults[this.version] ||
      Document.defaults[this.options.version] ||
      {}
    )
  }

  setSchema() {
    if (!this.schema)
      this.schema = new Schema(
        Object.assign({}, this.getDefaults(), this.options)
      )
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
        case 'YAML:1.0':
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
    this.setSchema()
    this.anchors._cstAliases = []
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
    this.anchors.resolveNodes()
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
    let [version] = directive.parameters
    if (directive.name === 'YAML:1.0') version = '1.0'
    if (this.version) {
      const msg =
        'The %YAML directive must only be given at most once per document.'
      this.errors.push(new YAMLSemanticError(directive, msg))
    }
    if (!version) {
      const msg = 'Insufficient parameters given for %YAML directive'
      this.errors.push(new YAMLSemanticError(directive, msg))
    } else {
      if (!Document.defaults[version]) {
        const v0 = this.version || this.options.version
        const msg = `Document will be parsed as YAML ${v0} rather than YAML ${version}`
        this.warnings.push(new YAMLWarning(directive, msg))
      }
      this.version = version
    }
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
        let prefix = this.tagPrefixes.find(p => p.handle === handle)
        if (!prefix) {
          const dtp = this.getDefaults().tagPrefixes
          if (dtp) prefix = dtp.find(p => p.handle === handle)
        }
        if (prefix) {
          if (suffix) {
            if (
              handle === '!' &&
              (this.version || this.options.version) === '1.0'
            ) {
              if (suffix[0] === '^') return suffix
              if (/[:/]/.test(suffix)) {
                // word/foo -> tag:word.yaml.org,2002:foo
                const vocab = suffix.match(/^([a-z0-9-]+)\/(.*)/i)
                return vocab
                  ? `tag:${vocab[1]}.yaml.org,2002:${vocab[2]}`
                  : `tag:${suffix}`
              }
            }
            return prefix.prefix + suffix
          }
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
    if (hasAnchor) {
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
    let res
    if (node.type === Type.ALIAS) {
      if (hasAnchor || hasTag)
        errors.push(
          new YAMLSemanticError(
            node,
            'An alias node must not specify any properties'
          )
        )
      const name = node.rawValue
      const src = anchors.getNode(name)
      if (!src) {
        errors.push(
          new YAMLReferenceError(node, `Aliased anchor not found: ${name}`)
        )
        return null
      }
      // Lazy resolution for circular references
      res = new Alias(src)
      anchors._cstAliases.push(res)
      if (!src.resolved) {
        this.warnings.push(
          new YAMLWarning(
            node,
            'Alias node contains a circular reference, which cannot be resolved as JSON'
          )
        )
      }
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
    return listTagNames(this.contents).filter(
      t => t.indexOf(defaultPrefix) !== 0
    )
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

  stringifyTag(tag) {
    if ((this.version || this.options.version) === '1.0') {
      const priv = tag.match(/^tag:private\.yaml\.org,2002:([^:/]+)$/)
      if (priv) return '!' + priv[1]
      const vocab = tag.match(/^tag:([a-zA-Z0-9-]+)\.yaml\.org,2002:(.*)/)
      return vocab ? `!${vocab[1]}/${vocab[2]}` : `!${tag.replace(/^tag:/, '')}`
    } else {
      const p = this.tagPrefixes.find(p => tag.indexOf(p.prefix) === 0)
      if (p) return p.handle + tag.substr(p.prefix.length)
      return tag[0] === '!' ? tag : `!<${tag}>`
    }
  }

  toJSON() {
    const cr = this.warnings.find(w => /circular reference/.test(w.message))
    if (cr) throw new YAMLSemanticError(cr.source, cr.message)
    return toJSON(this.contents)
  }

  toString() {
    if (this.errors.length > 0)
      throw new Error('Document with errors cannot be stringified')
    this.setSchema()
    const lines = []
    if (this.commentBefore) lines.push(this.commentBefore.replace(/^/gm, '#'))
    let hasDirectives = false
    if (this.version) {
      let vd = '%YAML 1.2'
      if (this.schema.name === 'yaml-1.1') {
        if (this.version === '1.0') vd = '%YAML:1.0'
        else if (this.version === '1.1') vd = '%YAML 1.1'
      }
      lines.push(vd)
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
      anchors: {},
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
