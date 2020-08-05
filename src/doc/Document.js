import { Collection, Node, Scalar, isEmptyPath, toJSON } from '../ast/index.js'
import { Document as CSTDocument } from '../cst/Document'
import { defaultTagPrefix } from '../constants.js'
import { YAMLError } from '../errors.js'
import { documentOptions } from '../options.js'
import { addComment } from '../stringify/addComment.js'
import { stringify } from '../stringify/stringify.js'

import { Anchors } from './Anchors.js'
import { Schema } from './Schema.js'
import { listTagNames } from './listTagNames.js'
import { parseContents } from './parseContents.js'
import { parseDirectives } from './parseDirectives.js'

function assertCollection(contents) {
  if (contents instanceof Collection) return true
  throw new Error('Expected a YAML collection as document contents')
}

export class Document {
  static defaults = documentOptions

  constructor(contents, options) {
    this.anchors = new Anchors(options.anchorPrefix)
    this.commentBefore = null
    this.comment = null
    this.directivesEndMarker = null
    this.errors = []
    this.options = options
    this.tagPrefixes = []
    this.version = null
    this.warnings = []

    if (contents === undefined) {
      this.schema = null
      this.contents = null
    } else if (contents instanceof CSTDocument) {
      this.parse(contents)
    } else {
      this.setSchema()
      this.contents = this.schema.createNode(contents, true)
    }
  }

  add(value) {
    assertCollection(this.contents)
    return this.contents.add(value)
  }

  addIn(path, value) {
    assertCollection(this.contents)
    this.contents.addIn(path, value)
  }

  delete(key) {
    assertCollection(this.contents)
    return this.contents.delete(key)
  }

  deleteIn(path) {
    if (isEmptyPath(path)) {
      if (this.contents == null) return false
      this.contents = null
      return true
    }
    assertCollection(this.contents)
    return this.contents.deleteIn(path)
  }

  getDefaults() {
    return (
      Document.defaults[this.version] ||
      Document.defaults[this.options.version] ||
      {}
    )
  }

  get(key, keepScalar) {
    return this.contents instanceof Collection
      ? this.contents.get(key, keepScalar)
      : undefined
  }

  getIn(path, keepScalar) {
    if (isEmptyPath(path))
      return !keepScalar && this.contents instanceof Scalar
        ? this.contents.value
        : this.contents
    return this.contents instanceof Collection
      ? this.contents.getIn(path, keepScalar)
      : undefined
  }

  has(key) {
    return this.contents instanceof Collection ? this.contents.has(key) : false
  }

  hasIn(path) {
    if (isEmptyPath(path)) return this.contents !== undefined
    return this.contents instanceof Collection
      ? this.contents.hasIn(path)
      : false
  }

  set(key, value) {
    assertCollection(this.contents)
    this.contents.set(key, value)
  }

  setIn(path, value) {
    if (isEmptyPath(path)) this.contents = value
    else {
      assertCollection(this.contents)
      this.contents.setIn(path, value)
    }
  }

  setSchema(id, customTags) {
    if (!id && !customTags && this.schema) return
    if (typeof id === 'number') id = id.toFixed(1)
    if (id === '1.0' || id === '1.1' || id === '1.2') {
      if (this.version) this.version = id
      else this.options.version = id
      delete this.options.schema
    } else if (id && typeof id === 'string') {
      this.options.schema = id
    }
    if (Array.isArray(customTags)) this.options.customTags = customTags
    const opt = Object.assign({}, this.getDefaults(), this.options)
    this.schema = new Schema(opt, this.anchors)
  }

  parse(node, prevDoc) {
    if (this.options.keepCstNodes) this.cstNode = node
    if (this.options.keepNodeTypes) this.type = 'DOCUMENT'
    const {
      directives = [],
      contents = [],
      directivesEndMarker,
      error,
      valueRange
    } = node
    if (error) {
      if (!error.source) error.source = this
      this.errors.push(error)
    }
    parseDirectives(this, directives, prevDoc)
    if (directivesEndMarker) this.directivesEndMarker = true
    this.range = valueRange ? [valueRange.start, valueRange.end] : null
    this.setSchema()
    this.anchors._cstAliases = []
    parseContents(this, contents)
    this.anchors.resolveNodes()
    if (this.options.prettyErrors) {
      for (const error of this.errors)
        if (error instanceof YAMLError) error.makePretty()
      for (const warn of this.warnings)
        if (warn instanceof YAMLError) warn.makePretty()
    }
    return this
  }

  listNonDefaultTags() {
    return listTagNames(this.contents).filter(
      t => t.indexOf(defaultTagPrefix) !== 0
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

  toJSON(arg, onAnchor) {
    const { keepBlobsInJSON, mapAsMap, maxAliasCount } = this.options
    const keep =
      keepBlobsInJSON &&
      (typeof arg !== 'string' || !(this.contents instanceof Scalar))
    const ctx = {
      doc: this,
      indentStep: '  ',
      keep,
      mapAsMap: keep && !!mapAsMap,
      maxAliasCount,
      stringify // Requiring directly in Pair would create circular dependencies
    }
    const anchorNames = Object.keys(this.anchors.map)
    if (anchorNames.length > 0)
      ctx.anchors = new Map(
        anchorNames.map(name => [
          this.anchors.map[name],
          { alias: [], aliasCount: 0, count: 1 }
        ])
      )
    const res = toJSON(this.contents, arg, ctx)
    if (typeof onAnchor === 'function' && ctx.anchors)
      for (const { count, res } of ctx.anchors.values()) onAnchor(res, count)
    return res
  }

  toString() {
    if (this.errors.length > 0)
      throw new Error('Document with errors cannot be stringified')
    const indentSize = this.options.indent
    if (!Number.isInteger(indentSize) || indentSize <= 0) {
      const s = JSON.stringify(indentSize)
      throw new Error(`"indent" option must be a positive integer, not ${s}`)
    }
    this.setSchema()
    const lines = []
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
    if (hasDirectives || this.directivesEndMarker) lines.push('---')
    if (this.commentBefore) {
      if (hasDirectives || !this.directivesEndMarker) lines.unshift('')
      lines.unshift(this.commentBefore.replace(/^/gm, '#'))
    }
    const ctx = {
      anchors: {},
      doc: this,
      indent: '',
      indentStep: ' '.repeat(indentSize),
      stringify // Requiring directly in nodes would create circular dependencies
    }
    let chompKeep = false
    let contentComment = null
    if (this.contents) {
      if (this.contents instanceof Node) {
        if (
          this.contents.spaceBefore &&
          (hasDirectives || this.directivesEndMarker)
        )
          lines.push('')
        if (this.contents.commentBefore)
          lines.push(this.contents.commentBefore.replace(/^/gm, '#'))
        // top-level block scalars need to be indented if followed by a comment
        ctx.forceBlockIndent = !!this.comment
        contentComment = this.contents.comment
      }
      const onChompKeep = contentComment ? null : () => (chompKeep = true)
      const body = stringify(
        this.contents,
        ctx,
        () => (contentComment = null),
        onChompKeep
      )
      lines.push(addComment(body, '', contentComment))
    } else {
      lines.push(stringify(this.contents, ctx))
    }
    if (this.comment) {
      if ((!chompKeep || contentComment) && lines[lines.length - 1] !== '')
        lines.push('')
      lines.push(this.comment.replace(/^/gm, '#'))
    }
    return lines.join('\n') + '\n'
  }
}
