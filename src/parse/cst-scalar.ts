import type { ComposeErrorHandler } from '../compose/composer.js'
import { resolveBlockScalar } from '../compose/resolve-block-scalar.js'
import { resolveFlowScalar } from '../compose/resolve-flow-scalar.js'
import { ErrorCode, YAMLParseError } from '../errors.js'
import { Range } from '../nodes/Node.js'
import type { Scalar } from '../nodes/Scalar.js'
import type { StringifyContext } from '../stringify/stringify.js'
import { stringifyString } from '../stringify/stringifyString.js'
import type { BlockScalar, FlowScalar, SourceToken, Token } from './cst.js'

/**
 * If `token` is a CST flow or block scalar, determine its string value and a few other attributes.
 * Otherwise, return `null`.
 */
export function resolveAsScalar(
  token: FlowScalar | BlockScalar,
  strict?: boolean,
  onError?: (offset: number, code: ErrorCode, message: string) => void
): {
  value: string
  type: Scalar.Type | null
  comment: string
  range: Range
}
export function resolveAsScalar(
  token: Token | null | undefined,
  strict?: boolean,
  onError?: (offset: number, code: ErrorCode, message: string) => void
): {
  value: string
  type: Scalar.Type | null
  comment: string
  range: Range
} | null
export function resolveAsScalar(
  token: Token | null | undefined,
  strict = true,
  onError?: (offset: number, code: ErrorCode, message: string) => void
): {
  value: string
  type: Scalar.Type | null
  comment: string
  range: Range
} | null {
  if (token) {
    const _onError: ComposeErrorHandler = (pos, code, message) => {
      const offset =
        typeof pos === 'number' ? pos : Array.isArray(pos) ? pos[0] : pos.offset
      if (onError) onError(offset, code, message)
      else throw new YAMLParseError([offset, offset + 1], code, message)
    }
    switch (token.type) {
      case 'scalar':
      case 'single-quoted-scalar':
      case 'double-quoted-scalar':
        return resolveFlowScalar(token, strict, _onError)
      case 'block-scalar':
        return resolveBlockScalar(token, strict, _onError)
    }
  }
  return null
}

/**
 * Create a new scalar token with `value`
 *
 * Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
 * as this function does not support any schema operations and won't check for such conflicts.
 *
 * @param value The string representation of the value, which will have its content properly indented.
 * @param context.end Comments and whitespace after the end of the value, or after the block scalar header. If undefined, a newline will be added.
 * @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
 * @param context.indent The indent level of the token.
 * @param context.inFlow Is this scalar within a flow collection? This may affect the resolved type of the token's value.
 * @param context.offset The offset position of the token.
 * @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
 */
export function createScalarToken(
  value: string,
  context: {
    end?: SourceToken[]
    implicitKey?: boolean
    indent: number
    inFlow?: boolean
    offset?: number
    type?: Scalar.Type
  }
): BlockScalar | FlowScalar {
  const {
    implicitKey = false,
    indent,
    inFlow = false,
    offset = -1,
    type = 'PLAIN'
  } = context
  const source = stringifyString(
    { type, value } as Scalar,
    {
      implicitKey,
      indent: indent > 0 ? ' '.repeat(indent) : '',
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    } as StringifyContext
  )
  const end = context.end ?? [
    { type: 'newline', offset: -1, indent, source: '\n' }
  ]
  switch (source[0]) {
    case '|':
    case '>': {
      const he = source.indexOf('\n')
      const head = source.substring(0, he)
      const body = source.substring(he + 1) + '\n'
      const props: Token[] = [
        { type: 'block-scalar-header', offset, indent, source: head }
      ]
      if (!addEndtoBlockProps(props, end))
        props.push({ type: 'newline', offset: -1, indent, source: '\n' })
      return { type: 'block-scalar', offset, indent, props, source: body }
    }
    case '"':
      return { type: 'double-quoted-scalar', offset, indent, source, end }
    case "'":
      return { type: 'single-quoted-scalar', offset, indent, source, end }
    default:
      return { type: 'scalar', offset, indent, source, end }
  }
}

/**
 * Set the value of `token` to the given string `value`, overwriting any previous contents and type that it may have.
 *
 * Best efforts are made to retain any comments previously associated with the `token`,
 * though all contents within a collection's `items` will be overwritten.
 *
 * Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
 * as this function does not support any schema operations and won't check for such conflicts.
 *
 * @param token Any token. If it does not include an `indent` value, the value will be stringified as if it were an implicit key.
 * @param value The string representation of the value, which will have its content properly indented.
 * @param context.afterKey In most cases, values after a key should have an additional level of indentation.
 * @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
 * @param context.inFlow Being within a flow collection may affect the resolved type of the token's value.
 * @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
 */
export function setScalarValue(
  token: Token,
  value: string,
  context: {
    afterKey?: boolean
    implicitKey?: boolean
    inFlow?: boolean
    type?: Scalar.Type
  } = {}
) {
  let { afterKey = false, implicitKey = false, inFlow = false, type } = context
  let indent = 'indent' in token ? token.indent : null
  if (afterKey && typeof indent === 'number') indent += 2
  if (!type)
    switch (token.type) {
      case 'single-quoted-scalar':
        type = 'QUOTE_SINGLE'
        break
      case 'double-quoted-scalar':
        type = 'QUOTE_DOUBLE'
        break
      case 'block-scalar': {
        const header = token.props[0]
        if (header.type !== 'block-scalar-header')
          throw new Error('Invalid block scalar header')
        type = header.source[0] === '>' ? 'BLOCK_FOLDED' : 'BLOCK_LITERAL'
        break
      }
      default:
        type = 'PLAIN'
    }
  const source = stringifyString(
    { type, value } as Scalar,
    {
      implicitKey: implicitKey || indent === null,
      indent: indent !== null && indent > 0 ? ' '.repeat(indent) : '',
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    } as StringifyContext
  )
  switch (source[0]) {
    case '|':
    case '>':
      setBlockScalarValue(token, source)
      break
    case '"':
      setFlowScalarValue(token, source, 'double-quoted-scalar')
      break
    case "'":
      setFlowScalarValue(token, source, 'single-quoted-scalar')
      break
    default:
      setFlowScalarValue(token, source, 'scalar')
  }
}

function setBlockScalarValue(token: Token, source: string) {
  const he = source.indexOf('\n')
  const head = source.substring(0, he)
  const body = source.substring(he + 1) + '\n'
  if (token.type === 'block-scalar') {
    const header = token.props[0]
    if (header.type !== 'block-scalar-header')
      throw new Error('Invalid block scalar header')
    header.source = head
    token.source = body
  } else {
    const { offset } = token
    const indent = 'indent' in token ? token.indent : -1
    const props: Token[] = [
      { type: 'block-scalar-header', offset, indent, source: head }
    ]
    if (!addEndtoBlockProps(props, 'end' in token ? token.end : undefined))
      props.push({ type: 'newline', offset: -1, indent, source: '\n' })

    for (const key of Object.keys(token))
      if (key !== 'type' && key !== 'offset') delete (token as any)[key]
    Object.assign(token, { type: 'block-scalar', indent, props, source: body })
  }
}

/** @returns `true` if last token is a newline */
function addEndtoBlockProps(props: Token[], end?: SourceToken[]) {
  if (end)
    for (const st of end)
      switch (st.type) {
        case 'space':
        case 'comment':
          props.push(st)
          break
        case 'newline':
          props.push(st)
          return true
      }
  return false
}

function setFlowScalarValue(
  token: Token,
  source: string,
  type: 'scalar' | 'double-quoted-scalar' | 'single-quoted-scalar'
) {
  switch (token.type) {
    case 'scalar':
    case 'double-quoted-scalar':
    case 'single-quoted-scalar':
      token.type = type
      token.source = source
      break
    case 'block-scalar': {
      const end = token.props.slice(1)
      let oa = source.length
      if (token.props[0].type === 'block-scalar-header')
        oa -= token.props[0].source.length
      for (const tok of end) tok.offset += oa
      delete (token as any).props
      Object.assign(token, { type, source, end })
      break
    }
    case 'block-map':
    case 'block-seq': {
      const offset = token.offset + source.length
      const nl = { type: 'newline', offset, indent: token.indent, source: '\n' }
      delete (token as any).items
      Object.assign(token, { type, source, end: [nl] })
      break
    }
    default: {
      const indent = 'indent' in token ? token.indent : -1
      const end =
        'end' in token && Array.isArray(token.end)
          ? token.end.filter(
              st =>
                st.type === 'space' ||
                st.type === 'comment' ||
                st.type === 'newline'
            )
          : []
      for (const key of Object.keys(token))
        if (key !== 'type' && key !== 'offset') delete (token as any)[key]
      Object.assign(token, { type, indent, source, end })
    }
  }
}
