export { Composer } from './compose/composer.ts'

export { Document } from './doc/Document.ts'
export { Schema } from './schema/Schema.ts'

export type { ErrorCode } from './errors.ts'
export { YAMLError, YAMLParseError, YAMLWarning } from './errors.ts'

export { Alias } from './nodes/Alias.ts'
export {
  isAlias,
  isCollection,
  isDocument,
  isMap,
  isNode,
  isPair,
  isScalar,
  isMergeKey,
  MERGE_KEY,
  isSeq
} from './nodes/identity.ts'
export type { Node, ParsedNode, Range } from './nodes/Node.ts'
export { Pair } from './nodes/Pair.ts'
export { Scalar } from './nodes/Scalar.ts'
export { YAMLMap } from './nodes/YAMLMap.ts'
export { YAMLSeq } from './nodes/YAMLSeq.ts'

export type {
  CreateNodeOptions,
  DocumentOptions,
  ParseOptions,
  SchemaOptions,
  ToJSOptions,
  ToStringOptions
} from './options.ts'

export * as CST from './parse/cst.ts'
export { lex } from './parse/lexer.ts'
export { LineCounter } from './parse/line-counter.ts'
export { Parser } from './parse/parser.ts'

export type { EmptyStream } from './public-api.ts'
export {
  parse,
  parseAllDocuments,
  parseDocument,
  stringify
} from './public-api.ts'

export type { TagId, Tags } from './schema/tags.ts'
export type { CollectionTag, ScalarTag } from './schema/types.ts'
export type { YAMLOMap } from './schema/yaml-1.1/omap.ts'
export type { YAMLSet } from './schema/yaml-1.1/set.ts'

export type {
  asyncVisitor,
  asyncVisitorFn,
  visitor,
  visitorFn
} from './visit.ts'
export { visit, visitAsync } from './visit.ts'
