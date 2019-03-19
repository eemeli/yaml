import { Type } from '../cst/Node'

export const boolOptions = { trueStr: 'true', falseStr: 'false' }

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
