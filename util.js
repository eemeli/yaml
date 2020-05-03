const ast = require('./dist/ast')
exports.findPair = ast.findPair
exports.parseMap = ast.parseMap
exports.parseSeq = ast.parseSeq

exports.stringifyNumber = require('./dist/stringify/stringifyNumber').stringifyNumber
exports.stringifyString = require('./dist/stringify/stringifyString').stringifyString
exports.toJSON = require('./dist/toJSON').toJSON
exports.Type = require('./dist/constants').Type

const err = require('./dist/errors')
exports.YAMLError = err.YAMLError
exports.YAMLReferenceError = err.YAMLReferenceError
exports.YAMLSemanticError = err.YAMLSemanticError
exports.YAMLSyntaxError = err.YAMLSyntaxError
exports.YAMLWarning = err.YAMLWarning
