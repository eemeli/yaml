import {
  core,
  nullObj,
  boolObj,
  octObj,
  intObj,
  hexObj,
  nanObj,
  expObj,
  floatObj
} from './core.js'
import { failsafe } from './failsafe/index.js'
import { json } from './json.js'
import { yaml11 } from './yaml-1.1/index.js'

import { map } from './failsafe/map.js'
import { seq } from './failsafe/seq.js'

import { binary } from './yaml-1.1/binary.js'
import { omap } from './yaml-1.1/omap.js'
import { pairs } from './yaml-1.1/pairs.js'
import { set } from './yaml-1.1/set.js'
import { floatTime, intTime, timestamp } from './yaml-1.1/timestamp.js'

export const schemas = { core, failsafe, json, yaml11 }
export const tags = {
  binary,
  bool: boolObj,
  float: floatObj,
  floatExp: expObj,
  floatNaN: nanObj,
  floatTime,
  int: intObj,
  intHex: hexObj,
  intOct: octObj,
  intTime,
  map,
  null: nullObj,
  omap,
  pairs,
  seq,
  set,
  timestamp
}
