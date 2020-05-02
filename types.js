const opt = require('./dist/tags/options')
exports.binaryOptions = opt.binaryOptions
exports.boolOptions = opt.boolOptions
exports.intOptions = opt.intOptions
exports.nullOptions = opt.nullOptions
exports.strOptions = opt.strOptions

const schema = require('./dist/schema')
exports.Schema = schema.Schema
exports.YAMLMap = schema.YAMLMap
exports.YAMLSeq = schema.YAMLSeq
exports.Pair = schema.Pair
exports.Scalar = schema.Scalar
