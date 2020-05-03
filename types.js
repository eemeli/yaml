const opt = require('./dist/tags/options')
exports.binaryOptions = opt.binaryOptions
exports.boolOptions = opt.boolOptions
exports.intOptions = opt.intOptions
exports.nullOptions = opt.nullOptions
exports.strOptions = opt.strOptions

const schema = require('./dist/doc/Schema')
exports.Schema = schema.Schema

const ast = require('./dist/ast')
exports.Pair = ast.Pair
exports.Scalar = ast.Scalar
exports.YAMLMap = ast.YAMLMap
exports.YAMLSeq = ast.YAMLSeq
