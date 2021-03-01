import { Type } from '../constants.js'
import { createNode, CreateNodeContext } from '../doc/createNode.js'
import { warn } from '../log.js'
import { addComment } from '../stringify/addComment.js'
import {
  createStringifyContext,
  stringify,
  StringifyContext
} from '../stringify/stringify.js'

import { Scalar } from './Scalar.js'
import { toJS, ToJSContext } from './toJS.js'
import {
  isCollection,
  isNode,
  isScalar,
  isSeq,
  Node,
  NodeBase,
  PAIR
} from './Node.js'

export function createPair(
  key: unknown,
  value: unknown,
  ctx: CreateNodeContext
) {
  const k = createNode(key, undefined, ctx)
  const v = createNode(value, undefined, ctx)
  return new Pair(k, v)
}

export enum PairType {
  PAIR = 'PAIR',
  MERGE_PAIR = 'MERGE_PAIR'
}

export class Pair<K = unknown, V = unknown> extends NodeBase {
  /** Always Node or null when parsed, but can be set to anything. */
  key: K

  /** Always Node or null when parsed, but can be set to anything. */
  value: V | null

  type: PairType

  constructor(key: K, value: V | null = null) {
    super(PAIR)
    this.key = key
    this.value = value
    this.type = PairType.PAIR
  }

  // @ts-ignore This is fine.
  get commentBefore() {
    return isNode(this.key) ? this.key.commentBefore : undefined
  }

  set commentBefore(cb) {
    if (this.key == null) this.key = new Scalar(null) as any // FIXME
    if (isNode(this.key)) this.key.commentBefore = cb
    else {
      const msg =
        'Pair.commentBefore is an alias for Pair.key.commentBefore. To set it, the key must be a Node.'
      throw new Error(msg)
    }
  }

  // @ts-ignore This is fine.
  get spaceBefore() {
    return isNode(this.key) ? this.key.spaceBefore : undefined
  }

  set spaceBefore(sb) {
    if (this.key == null) this.key = new Scalar(null) as any // FIXME
    if (isNode(this.key)) this.key.spaceBefore = sb
    else {
      const msg =
        'Pair.spaceBefore is an alias for Pair.key.spaceBefore. To set it, the key must be a Node.'
      throw new Error(msg)
    }
  }

  addToJSMap(
    ctx: ToJSContext | undefined,
    map:
      | Map<unknown, unknown>
      | Set<unknown>
      | Record<string | number | symbol, unknown>
  ) {
    const key = toJS(this.key, '', ctx)
    if (map instanceof Map) {
      const value = toJS(this.value, key, ctx)
      map.set(key, value)
    } else if (map instanceof Set) {
      map.add(key)
    } else {
      const stringKey = stringifyKey(this.key, key, ctx)
      const value = toJS(this.value, stringKey, ctx)
      if (stringKey in map)
        Object.defineProperty(map, stringKey, {
          value,
          writable: true,
          enumerable: true,
          configurable: true
        })
      else map[stringKey] = value
    }
    return map
  }

  toJSON(_?: unknown, ctx?: ToJSContext) {
    const pair = ctx && ctx.mapAsMap ? new Map() : {}
    return this.addToJSMap(ctx, pair)
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ) {
    if (!ctx || !ctx.doc) return JSON.stringify(this)
    const {
      allNullValues,
      doc,
      indent,
      indentStep,
      options: { indentSeq, simpleKeys }
    } = ctx
    let { key, value }: { key: K; value: V | Node | null } = this
    let keyComment = (isNode(key) && key.comment) || null
    if (simpleKeys) {
      if (keyComment) {
        throw new Error('With simple keys, key nodes cannot have comments')
      }
      if (isCollection(key)) {
        const msg = 'With simple keys, collection cannot be used as a key value'
        throw new Error(msg)
      }
    }
    let explicitKey =
      !simpleKeys &&
      (!key ||
        (keyComment && value == null) ||
        isCollection(key) ||
        (isScalar(key)
          ? key.type === Type.BLOCK_FOLDED || key.type === Type.BLOCK_LITERAL
          : typeof key === 'object'))

    ctx = Object.assign({}, ctx, {
      allNullValues: false,
      implicitKey: !explicitKey && (simpleKeys || !allNullValues),
      indent: indent + indentStep
    })
    let chompKeep = false
    let str = stringify(
      key,
      ctx,
      () => (keyComment = null),
      () => (chompKeep = true)
    )

    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
      if (simpleKeys)
        throw new Error(
          'With simple keys, single line scalar must not span more than 1024 characters'
        )
      explicitKey = true
    }

    if (
      (allNullValues && (!simpleKeys || ctx.inFlow)) ||
      (value == null && (explicitKey || ctx.inFlow))
    ) {
      str = addComment(str, ctx.indent, keyComment)
      if (this.comment) {
        if (keyComment && !this.comment.includes('\n'))
          str += `\n${ctx.indent || ''}#${this.comment}`
        else str = addComment(str, ctx.indent, this.comment)
        if (onComment) onComment()
      } else if (chompKeep && !keyComment && onChompKeep) onChompKeep()
      return ctx.inFlow && !explicitKey ? str : `? ${str}`
    }

    str = explicitKey
      ? `? ${addComment(str, ctx.indent, keyComment)}\n${indent}:`
      : addComment(`${str}:`, ctx.indent, keyComment)
    if (this.comment) {
      if (keyComment && !explicitKey && !this.comment.includes('\n'))
        str += `\n${ctx.indent || ''}#${this.comment}`
      else str = addComment(str, ctx.indent, this.comment)
      if (onComment) onComment()
    }

    let vcb = ''
    let valueComment = null
    if (isNode(value)) {
      if (value.spaceBefore) vcb = '\n'
      if (value.commentBefore) {
        const cs = value.commentBefore.replace(/^/gm, `${ctx.indent}#`)
        vcb += `\n${cs}`
      }
      valueComment = value.comment
    } else if (value && typeof value === 'object') {
      value = doc.createNode(value)
    }
    ctx.implicitKey = false
    if (!explicitKey && !keyComment && !this.comment && isScalar(value))
      ctx.indentAtStart = str.length + 1
    chompKeep = false
    if (
      !indentSeq &&
      indentStep.length >= 2 &&
      !ctx.inFlow &&
      !explicitKey &&
      isSeq(value) &&
      !value.flow &&
      !value.tag &&
      !doc.anchors.getName(value)
    ) {
      // If indentSeq === false, consider '- ' as part of indentation where possible
      ctx.indent = ctx.indent.substr(2)
    }
    const valueStr = stringify(
      value,
      ctx,
      () => (valueComment = null),
      () => (chompKeep = true)
    )
    let ws = ' '
    if (vcb || keyComment || this.comment) {
      ws = `${vcb}\n${ctx.indent}`
    } else if (!explicitKey && isCollection(value)) {
      const flow = valueStr[0] === '[' || valueStr[0] === '{'
      if (!flow || valueStr.includes('\n')) ws = `\n${ctx.indent}`
    } else if (valueStr[0] === '\n') ws = ''
    if (chompKeep && !valueComment && onChompKeep) onChompKeep()
    return addComment(str + ws + valueStr, ctx.indent, valueComment)
  }
}

function stringifyKey(
  key: unknown,
  jsKey: unknown,
  ctx: ToJSContext | undefined
) {
  if (jsKey === null) return ''
  if (typeof jsKey !== 'object') return String(jsKey)
  if (isNode(key) && ctx && ctx.doc) {
    const strCtx = createStringifyContext(ctx.doc, {})
    strCtx.inFlow = true
    strCtx.inStringifyKey = true
    const strKey = key.toString(strCtx)
    if (!ctx.mapKeyWarned) {
      let jsonStr = JSON.stringify(strKey)
      if (jsonStr.length > 40) jsonStr = jsonStr.substring(0, 36) + '..."'
      warn(
        ctx.doc.options.logLevel,
        `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`
      )
      ctx.mapKeyWarned = true
    }
    return strKey
  }
  return JSON.stringify(jsKey)
}
