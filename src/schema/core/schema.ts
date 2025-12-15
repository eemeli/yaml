import { map } from '../common/map.ts'
import { nullTag } from '../common/null.ts'
import { seq } from '../common/seq.ts'
import { string } from '../common/string.ts'
import type { CollectionTag, ScalarTag } from '../types.ts'
import { boolTag } from './bool.ts'
import { float, floatExp, floatNaN } from './float.ts'
import { int, intHex, intOct } from './int.ts'

export const schema: (CollectionTag | ScalarTag)[] = [
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
