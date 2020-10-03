import { Scalar } from '../ast'
import { Type } from '../constants'
import { Schema } from '../doc/Schema'
import { blockScalarValue } from './block-scalar-value'
import { flowScalarValue } from './flow-scalar-value'
import { BlockScalar, SourceToken } from './parser'

export function composeScalar(
  schema: Schema,
  tagName: string | null,
  token: SourceToken | BlockScalar,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  let type:
    | Type.BLOCK_FOLDED
    | Type.BLOCK_LITERAL
    | Type.PLAIN
    | Type.QUOTE_DOUBLE
    | Type.QUOTE_SINGLE
    | null = null
  const onType = (t: typeof type) => {
    type = t
  }
  const value =
    token.type === 'block-scalar'
      ? blockScalarValue(token, onError, onType)
      : flowScalarValue(token, onError, onType)
  const tag =
    findScalarTagByName(schema, value, tagName, onError) ||
    findScalarTagByTest(schema, value, token.type === 'scalar') ||
    findScalarTagByName(schema, value, '!', onError)

  let scalar: Scalar
  try {
    const res = tag ? tag.resolve(value, message => onError(0, message)) : value
    scalar = res instanceof Scalar ? res : new Scalar(res)
  } catch (error) {
    onError(0, error.message)
    scalar = new Scalar(value)
  }
  if (type) scalar.type = type
  if (tagName) scalar.tag = tagName
  if (tag && tag.format) scalar.format = tag.format
  return scalar
}

function findScalarTagByName(
  schema: Schema,
  value: string,
  tagName: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  if (!tagName) return null
  if (tagName === '!') tagName = 'tag:yaml.org,2002:str' // non-specific tag
  const matchWithTest: Schema.Tag[] = []
  for (const tag of schema.tags) {
    if (tag.tag === tagName) {
      if (tag.default && tag.test) matchWithTest.push(tag)
      else return tag
    }
  }
  for (const tag of matchWithTest)
    if (tag.test && tag.test.test(value)) return tag
  const kt = schema.knownTags[tagName]
  if (kt) {
    // Ensure that the known tag is available for stringifying,
    // but does not get used by default.
    schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }))
    return kt
  }
  onError(0, `Unresolved tag: ${tagName}`, tagName !== 'tag:yaml.org,2002:str')
  return null
}

function findScalarTagByTest(schema: Schema, value: string, apply: boolean) {
  if (apply) {
    for (const tag of schema.tags) {
      if (tag.default && tag.test && tag.test.test(value)) return tag
    }
  }
  return null
}
