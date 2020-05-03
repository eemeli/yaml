/* global atob, btoa, Buffer */

import { Type } from '../../constants.js'
import { YAMLReferenceError } from '../../errors.js'
import { resolveString } from '../../resolve/resolveString.js'
import { stringifyString } from '../../stringify/stringifyString.js'
import { binaryOptions as options } from '../options.js'

export const binary = {
  identify: value => value instanceof Uint8Array, // Buffer inherits from Uint8Array
  default: false,
  tag: 'tag:yaml.org,2002:binary',
  /**
   * Returns a Buffer in node and an Uint8Array in browsers
   *
   * To use the resulting buffer as an image, you'll want to do something like:
   *
   *   const blob = new Blob([buffer], { type: 'image/jpeg' })
   *   document.querySelector('#photo').src = URL.createObjectURL(blob)
   */
  resolve: (doc, node) => {
    const src = resolveString(doc, node)
    if (typeof Buffer === 'function') {
      return Buffer.from(src, 'base64')
    } else if (typeof atob === 'function') {
      // On IE 11, atob() can't handle newlines
      const str = atob(src.replace(/[\n\r]/g, ''))
      const buffer = new Uint8Array(str.length)
      for (let i = 0; i < str.length; ++i) buffer[i] = str.charCodeAt(i)
      return buffer
    } else {
      const msg =
        'This environment does not support reading binary tags; either Buffer or atob is required'
      doc.errors.push(new YAMLReferenceError(node, msg))
      return null
    }
  },
  options,
  stringify: ({ comment, type, value }, ctx, onComment, onChompKeep) => {
    let src
    if (typeof Buffer === 'function') {
      src =
        value instanceof Buffer
          ? value.toString('base64')
          : Buffer.from(value.buffer).toString('base64')
    } else if (typeof btoa === 'function') {
      let s = ''
      for (let i = 0; i < value.length; ++i) s += String.fromCharCode(value[i])
      src = btoa(s)
    } else {
      throw new Error(
        'This environment does not support writing binary tags; either Buffer or btoa is required'
      )
    }
    if (!type) type = options.defaultType
    if (type === Type.QUOTE_DOUBLE) {
      value = src
    } else {
      const { lineWidth } = options
      const n = Math.ceil(src.length / lineWidth)
      const lines = new Array(n)
      for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
        lines[i] = src.substr(o, lineWidth)
      }
      value = lines.join(type === Type.BLOCK_LITERAL ? '\n' : ' ')
    }
    return stringifyString(
      { comment, type, value },
      ctx,
      onComment,
      onChompKeep
    )
  }
}
