import { defaultTagPrefix } from './constants.js'
import {
  binaryOptions,
  boolOptions,
  intOptions,
  nullOptions,
  strOptions
} from './tags/options.js'

export const defaultOptions = {
  anchorPrefix: 'a',
  customTags: null,
  indent: 2,
  indentSeq: true,
  keepCstNodes: false,
  keepNodeTypes: true,
  keepUndefined: false,
  logLevel: 'warn',
  mapAsMap: false,
  maxAliasCount: 100,
  prettyErrors: true,
  simpleKeys: false,
  version: '1.2'
}

export const scalarOptions = {
  get binary() {
    return binaryOptions
  },
  set binary(opt) {
    Object.assign(binaryOptions, opt)
  },
  get bool() {
    return boolOptions
  },
  set bool(opt) {
    Object.assign(boolOptions, opt)
  },
  get int() {
    return intOptions
  },
  set int(opt) {
    Object.assign(intOptions, opt)
  },
  get null() {
    return nullOptions
  },
  set null(opt) {
    Object.assign(nullOptions, opt)
  },
  get str() {
    return strOptions
  },
  set str(opt) {
    Object.assign(strOptions, opt)
  }
}

export const documentOptions = {
  '1.0': {
    schema: 'yaml-1.1',
    merge: true,
    tagPrefixes: [
      { handle: '!', prefix: defaultTagPrefix },
      { handle: '!!', prefix: 'tag:private.yaml.org,2002:' }
    ]
  },
  1.1: {
    schema: 'yaml-1.1',
    merge: true,
    tagPrefixes: [
      { handle: '!', prefix: '!' },
      { handle: '!!', prefix: defaultTagPrefix }
    ]
  },
  1.2: {
    schema: 'core',
    merge: false,
    resolveKnownTags: true,
    tagPrefixes: [
      { handle: '!', prefix: '!' },
      { handle: '!!', prefix: defaultTagPrefix }
    ]
  }
}
