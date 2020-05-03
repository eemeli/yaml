import opt from './dist/tags/options.js'
export const binaryOptions = opt.binaryOptions
export const boolOptions = opt.boolOptions
export const intOptions = opt.intOptions
export const nullOptions = opt.nullOptions
export const strOptions = opt.strOptions

import schema from './dist/doc/Schema.js'
export const Schema = schema.Schema

import ast from './dist/ast/index.js'
export const Pair = ast.Pair
export const Scalar = ast.Scalar
export const YAMLMap = ast.YAMLMap
export const YAMLSeq = ast.YAMLSeq
