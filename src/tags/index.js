import core, {
  nullObj,
  boolObj,
  octObj,
  intObj,
  hexObj,
  nanObj,
  expObj,
  floatObj
} from './core'
import failsafe from './failsafe'
import json from './json'
import yaml11 from './yaml-1.1'

import map from './failsafe/map'
import seq from './failsafe/seq'
import binary from './yaml-1.1/binary'
import omap from './yaml-1.1/omap'
import pairs from './yaml-1.1/pairs'
import set from './yaml-1.1/set'
import { floatTime, intTime, timestamp } from './yaml-1.1/timestamp'

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
