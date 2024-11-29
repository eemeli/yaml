export { Composer } from './compose/composer.ts'

export { Document } from './doc/Document.ts'
export { Schema } from './schema/Schema.ts'

export { ErrorCode, YAMLError, YAMLParseError, YAMLWarning } from './errors.ts'

export { Alias } from './nodes/Alias.ts'
export {
  isAlias,
  isCollection,
  isDocument,
  isMap,
  isNode,
  isPair,
  isScalar,
  isSeq
} from './nodes/identity.ts'
export { Node, ParsedNode, Range } from './nodes/Node.ts'
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
export { Lexer } from './parse/lexer.ts'
export { LineCounter } from './parse/line-counter.ts'
export { Parser } from './parse/parser.ts'

export {
  EmptyStream,
  parse,
  parseAllDocuments,
  parseDocument,
  stringify
} from './public-api.ts'

export type { TagId, Tags } from './schema/tags.ts'
export type { CollectionTag, ScalarTag } from './schema/types.ts'
export type { YAMLOMap } from './schema/yaml-1.1/omap.ts'
export type { YAMLSet } from './schema/yaml-1.1/set.ts'

export {
  asyncVisitor,
  asyncVisitorFn,
  visit,
  visitAsync,
  visitor,
  visitorFn
} from './visit.ts'
