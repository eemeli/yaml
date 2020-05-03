const ast = require('./dist/ast')
exports.findPair = ast.findPair
exports.toJSON = ast.toJSON

const resolveMapPkg = require('./dist/resolve/resolveMap')
exports.parseMap = resolveMapPkg.resolveMap

const resolveSeqPkg = require('./dist/resolve/resolveSeq')
exports.parseSeq = resolveSeqPkg.resolveSeq

exports.stringifyNumber = require('./dist/stringify/stringifyNumber').stringifyNumber
exports.stringifyString = require('./dist/stringify/stringifyString').stringifyString
exports.Type = require('./dist/constants').Type

const err = require('./dist/errors')
exports.YAMLError = err.YAMLError
exports.YAMLReferenceError = err.YAMLReferenceError
exports.YAMLSemanticError = err.YAMLSemanticError
exports.YAMLSyntaxError = err.YAMLSyntaxError
exports.YAMLWarning = err.YAMLWarning
