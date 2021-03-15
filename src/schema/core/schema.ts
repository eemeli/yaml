import { map } from '../common/map.js'
import { nullTag } from '../common/null.js'
import { seq } from '../common/seq.js'
import { string } from '../common/string.js'
import { boolTag } from './bool.js'
import { float, floatExp, floatNaN } from './float.js'
import { int, intHex, intOct } from './int.js'

export const schema = [
  map,
  seq,
  string,
  nullTag,
  boolTag,
  intOct,
  int,
  intHex,
  floatNaN,
  floatExp,
  float
]
