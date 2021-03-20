import type { Schema } from '../schema/Schema.js'
import { isScalar, SCALAR } from '../nodes/Node.js'
import { Scalar } from '../nodes/Scalar.js'
import type { BlockScalar, FlowScalar } from '../parse/tokens.js'
import type { ScalarTag } from '../schema/types.js'
import { resolveBlockScalar } from './resolve-block-scalar.js'
import { resolveFlowScalar } from './resolve-flow-scalar.js'
import type { ComposeContext } from './compose-node.js'

export function composeScalar(
  ctx: ComposeContext,
  token: FlowScalar | BlockScalar,
  anchor: string | null,
  tagName: string | null,
  onError: (offset: number, message: string) => void
) {
  const { offset } = token
  const { value, type, comment, length } =
    token.type === 'block-scalar'
      ? resolveBlockScalar(token, ctx.options.strict, onError)
      : resolveFlowScalar(token, ctx.options.strict, onError)

  const tag = tagName
    ? findScalarTagByName(ctx.schema, value, tagName, onError)
    : findScalarTagByTest(ctx.schema, value, token.type === 'scalar')

  let scalar: Scalar
  try {
    const res = tag.resolve(value, msg => onError(offset, msg), ctx.options)
    scalar = isScalar(res) ? res : new Scalar(res)
  } catch (error) {
    onError(offset, error.message)
    scalar = new Scalar(value)
  }
  scalar.range = [offset, offset + length]
  scalar.source = value
  if (type) scalar.type = type
  if (tagName) scalar.tag = tagName
  if (tag.format) scalar.format = tag.format
  if (comment) scalar.comment = comment

  if (anchor) ctx.anchors.setAnchor(scalar, anchor)
  return scalar as Scalar.Parsed
}

function findScalarTagByName(
  schema: Schema,
  value: string,
  tagName: string,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  if (tagName === '!') return schema[SCALAR] // non-specific tag
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
  return schema[SCALAR]
}

function findScalarTagByTest(schema: Schema, value: string, apply: boolean) {
  if (apply) {
    for (const tag of schema.tags) {
      if (tag.default && tag.test?.test(value)) return tag
    }
  }
  return schema[SCALAR]
}
