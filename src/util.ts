/**
 * This module provides utilities that are likely to be of interest to
 * those wishing to implement their own [custom data types](https://eemeli.org/yaml/#custom-data-types).
 *
 * See also the [yaml-types](https://www.npmjs.com/package/yaml-types) package.
 *
 * @module
 */

export type { NodeCreator } from './doc/NodeCreator.ts'
export { debug, warn } from './log.ts'
export type { LogLevelId } from './log.ts'
export { ToJSContext } from './nodes/toJS.ts'
export { findPair } from './nodes/YAMLMap.ts'
export { map as mapTag } from './schema/common/map.ts'
export { seq as seqTag } from './schema/common/seq.ts'
export { string as stringTag } from './schema/common/string.ts'
export { foldFlowLines } from './stringify/foldFlowLines.ts'
export type { FoldOptions } from './stringify/foldFlowLines.ts'
export type { StringifyContext } from './stringify/stringify.ts'
export { stringifyNumber } from './stringify/stringifyNumber.ts'
export { stringifyString } from './stringify/stringifyString.ts'
