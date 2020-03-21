import { Type } from '../constants'

export const binaryOptions = {
  defaultType: Type.BLOCK_LITERAL,
  lineWidth: 76
}

export const boolOptions = { trueStr: 'true', falseStr: 'false' }

export const intOptions = { asBigInt: false }

export const nullOptions = { nullStr: 'null' }

export const strOptions = {
  defaultType: Type.PLAIN,
  doubleQuoted: {
    jsonEncoding: false,
    minMultiLineLength: 40
  },
  fold: {
    lineWidth: 80,
    minContentWidth: 20
  }
}
