import type { Document } from '../doc/Document.js'
import type { Schema } from '../schema/Schema.js'
import { isScalar } from '../nodes/Node.js'
import { Scalar } from '../nodes/Scalar.js'
import type { BlockScalar, FlowScalar } from '../parse/tokens.js'
import type { ScalarTag } from '../schema/types.js'
import { resolveBlockScalar } from './resolve-block-scalar.js'
import { resolveFlowScalar } from './resolve-flow-scalar.js'

export function composeScalar(
  doc: Document.Parsed,
  token: FlowScalar | BlockScalar,
  anchor: string | null,
  tagName: string | null,
  onError: (offset: number, message: string) => void
) {
  const { offset } = token
  const { value, type, comment, length } =
    token.type === 'block-scalar'
      ? resolveBlockScalar(token, doc.options.strict, onError)
      : resolveFlowScalar(token, doc.options.strict, onError)

  const tag = tagName
    ? findScalarTagByName(doc.schema, value, tagName, onError)
    : findScalarTagByTest(doc.schema, value, token.type === 'scalar')

  let scalar: Scalar
  try {
    const res = tag
      ? tag.resolve(value, msg => onError(offset, msg), doc.options)
      : value
    scalar = isScalar(res) ? res : new Scalar(res)
  } catch (error) {
    onError(offset, error.message)
    scalar = new Scalar(value)
  }
  scalar.range = [offset, offset + length]
  scalar.source = value
  if (type) scalar.type = type
  if (tagName) scalar.tag = tagName
  if (tag?.format) scalar.format = tag.format
  if (comment) scalar.comment = comment

  if (anchor) doc.anchors.setAnchor(scalar, anchor)
  return scalar as Scalar.Parsed
}

const defaultScalarTag = (schema: Schema) =>
  schema.tags.find(
    tag => !tag.collection && tag.tag === 'tag:yaml.org,2002:str'
  ) as ScalarTag | undefined

function findScalarTagByName(
  schema: Schema,
  value: string,
  tagName: string,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  if (tagName === '!') return defaultScalarTag(schema) // non-specific tag
  const matchWithTest: ScalarTag[] = []
  for (const tag of schema.tags) {
    if (!tag.collection && tag.tag === tagName) {
      if (tag.default && tag.test) matchWithTest.push(tag)
      else return tag
    }
  }
  for (const tag of matchWithTest) if (tag.test?.test(value)) return tag
  const kt = schema.knownTags[tagName]
  if (kt && !kt.collection) {
    // Ensure that the known tag is available for stringifying,
    // but does not get used by default.
    schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }))
    return kt
  }
  onError(0, `Unresolved tag: ${tagName}`, tagName !== 'tag:yaml.org,2002:str')
  return defaultScalarTag(schema)
}

function findScalarTagByTest(schema: Schema, value: string, apply: boolean) {
  if (apply) {
    for (const tag of schema.tags) {
      if (tag.default && tag.test?.test(value)) return tag
    }
  }
  return defaultScalarTag(schema)
}
