import {
  Alias,
  Collection,
  Node,
  Pair,
  Scalar,
  collectionFromPath,
  isEmptyPath,
  toJS
} from '../ast/index.js'
import { Document as CSTDocument } from '../cst/Document'
import { defaultTagPrefix } from '../constants.js'
import { YAMLError } from '../errors.js'
import { defaultOptions, documentOptions } from '../options.js'
import { addComment } from '../stringify/addComment.js'
import { stringify } from '../stringify/stringify.js'

import { Anchors } from './Anchors.js'
import { Schema } from './Schema.js'
import { createNode } from './createNode.js'
import { listTagNames } from './listTagNames.js'
import { parseContents } from './parseContents.js'
import { parseDirectives } from './parseDirectives.js'

function assertCollection(contents) {
  if (contents instanceof Collection) return true
  throw new Error('Expected a YAML collection as document contents')
}

export class Document {
  static defaults = documentOptions

  constructor(value, replacer, options) {
    if (
      options === undefined &&
      replacer &&
      typeof replacer === 'object' &&
      !Array.isArray(replacer)
    ) {
      options = replacer
      replacer = undefined
    }

    this.options = Object.assign({}, defaultOptions, options)
    this.anchors = new Anchors(this.options.anchorPrefix)
    this.commentBefore = null
    this.comment = null
    this.directivesEndMarker = null
    this.errors = []
    this.schema = null
    this.tagPrefixes = []
    this.version = null
    this.warnings = []

    if (value === undefined) {
      // note that this.schema is left as null here
      this.contents = null
    } else if (value instanceof CSTDocument) {
      this.parse(value)
    } else {
      this.contents = this.createNode(value, { replacer })
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

  createNode(value, { onTagObj, replacer, tag, wrapScalars } = {}) {
    this.setSchema()
    if (typeof replacer === 'function')
      value = replacer.call({ '': value }, '', value)
    else if (Array.isArray(replacer)) {
      const keyToStr = v =>
        typeof v === 'number' || v instanceof String || v instanceof Number
      const asStr = replacer.filter(keyToStr).map(String)
      if (asStr.length > 0) replacer = replacer.concat(asStr)
    }
    const aliasNodes = []
    const ctx = {
      onAlias(source) {
        const alias = new Alias(source)
        aliasNodes.push(alias)
        return alias
      },
      onTagObj,
      prevObjects: new Map(),
      replacer,
      schema: this.schema,
      wrapScalars: wrapScalars !== false
    }
    const node = createNode(value, tag, ctx)
    for (const alias of aliasNodes) {
      // With circular references, the source node is only resolved after all of
      // its child nodes are. This is why anchors are set only after all of the
      // nodes have been created.
      alias.source = alias.source.node
      let name = this.anchors.getName(alias.source)
      if (!name) {
        name = this.anchors.newName()
        this.anchors.map[name] = alias.source
      }
    }
    return node
  }

  createPair(key, value, options = {}) {
    const k = this.createNode(key, options)
    const v = this.createNode(value, options)
    return new Pair(k, v)
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
    if (this.contents == null) {
      this.setSchema()
      this.contents = collectionFromPath(this.schema, [key], value)
    } else {
      assertCollection(this.contents)
      this.contents.set(key, value)
    }
  }

  setIn(path, value) {
    if (isEmptyPath(path)) this.contents = value
    else if (this.contents == null) {
      this.setSchema()
      this.contents = collectionFromPath(this.schema, path, value)
    } else {
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
    this.schema = new Schema(opt)
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

  toJS({ json, jsonArg, mapAsMap, onAnchor } = {}) {
    const anchorNodes = Object.values(this.anchors.map).map(node => [
      node,
      { alias: [], aliasCount: 0, count: 1 }
    ])
    const anchors = anchorNodes.length > 0 ? new Map(anchorNodes) : null
    const ctx = {
      anchors,
      doc: this,
      indentStep: '  ',
      keep: !json,
      mapAsMap:
        typeof mapAsMap === 'boolean' ? mapAsMap : !!this.options.mapAsMap,
      maxAliasCount: this.options.maxAliasCount,
      stringify // Requiring directly in Pair would create circular dependencies
    }
    const res = toJS(this.contents, jsonArg || '', ctx)
    if (typeof onAnchor === 'function' && anchors)
      for (const { count, res } of anchors.values()) onAnchor(res, count)
    return res
  }

  toJSON(jsonArg, onAnchor) {
    return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor })
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
