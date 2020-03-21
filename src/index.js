import { parse as parseCST } from './cst/parse'
import { Document as YAMLDocument } from './Document'
import { YAMLSemanticError } from './errors'
import { Schema } from './schema'
import {
  binaryOptions,
  boolOptions,
  intOptions,
  nullOptions,
  strOptions
} from './tags/options'
import { warn } from './warnings'

const defaultOptions = {
  anchorPrefix: 'a',
  customTags: null,
  keepCstNodes: false,
  keepNodeTypes: true,
  keepBlobsInJSON: true,
  mapAsMap: false,
  maxAliasCount: 100,
  prettyErrors: false, // TODO Set true in v2
  simpleKeys: false,
  version: '1.2'
}

const scalarOptions = {
  get binary() {
    return binaryOptions
  },
  set binary(opt) {
    Object.assign(binaryOptions, opt)
  },
  get bool() {
    return boolOptions
  },
  set bool(opt) {
    Object.assign(boolOptions, opt)
  },
  get int() {
    return intOptions
  },
  set int(opt) {
    Object.assign(intOptions, opt)
  },
  get null() {
    return nullOptions
  },
  set null(opt) {
    Object.assign(nullOptions, opt)
  },
  get str() {
    return strOptions
  },
  set str(opt) {
    Object.assign(strOptions, opt)
  }
}

function createNode(value, wrapScalars = true, tag) {
  if (tag === undefined && typeof wrapScalars === 'string') {
    tag = wrapScalars
    wrapScalars = true
  }
  const options = Object.assign(
    {},
    YAMLDocument.defaults[defaultOptions.version],
    defaultOptions
  )
  const schema = new Schema(options)
  return schema.createNode(value, wrapScalars, tag)
}

class Document extends YAMLDocument {
  constructor(options) {
    super(Object.assign({}, defaultOptions, options))
  }
}

function parseAllDocuments(src, options) {
  const stream = []
  let prev
  for (const cstDoc of parseCST(src)) {
    const doc = new Document(options)
    doc.parse(cstDoc, prev)
    stream.push(doc)
    prev = doc
  }
  return stream
}

function parseDocument(src, options) {
  const cst = parseCST(src)
  const doc = new Document(options).parse(cst[0])
  if (cst.length > 1) {
    const errMsg =
      'Source contains multiple documents; please use YAML.parseAllDocuments()'
    doc.errors.unshift(new YAMLSemanticError(cst[1], errMsg))
  }
  return doc
}

function parse(src, options) {
  const doc = parseDocument(src, options)
  doc.warnings.forEach(warning => warn(warning))
  if (doc.errors.length > 0) throw doc.errors[0]
  return doc.toJSON()
}

function stringify(value, options) {
  const doc = new Document(options)
  doc.contents = value
  return String(doc)
}

export const YAML = {
  createNode,
  defaultOptions,
  Document,
  parse,
  parseAllDocuments,
  parseCST,
  parseDocument,
  scalarOptions,
  stringify
}
