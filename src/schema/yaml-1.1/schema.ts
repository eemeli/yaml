import { map } from '../common/map.js'
import { nullTag } from '../common/null.js'
import { seq } from '../common/seq.js'
import { string } from '../common/string.js'
import { binary } from './binary.js'
import { falseTag, trueTag } from './bool.js'
import { float, floatExp, floatNaN } from './float.js'
import { intBin, int, intHex, intOct } from './int.js'
import { omap } from './omap.js'
import { pairs } from './pairs.js'
import { set } from './set.js'
import { intTime, floatTime, timestamp } from './timestamp.js'

export const schema = [
  map,
  seq,
  string,
  nullTag,
  trueTag,
  falseTag,
  intBin,
  intOct,
  int,
  intHex,
  floatNaN,
  floatExp,
  float,
  binary,
  omap,
  pairs,
  set,
  intTime,
  floatTime,
  timestamp
]
