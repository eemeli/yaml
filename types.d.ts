import * as YAML from './index'

export const binaryOptions: YAML.ast.BinaryOptions
export const boolOptions: YAML.ast.BoolOptions
export const intOptions: YAML.ast.IntOptions
export const nullOptions: YAML.ast.NullOptions
export const strOptions: YAML.ast.StrOptions

export class Schema extends YAML.ast.Schema {}
export const YAMLMap: YAML.ast.MapConstructor
export const YAMLSeq: YAML.ast.SeqConstructor
export const Pair: YAML.ast.PairConstructor
export const Scalar: YAML.ast.ScalarConstructor
