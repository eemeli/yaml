exports.findPair = require('./dist/schema/Map').findPair
exports.parseMap = require('./dist/schema/parseMap').parseMap
exports.parseSeq = require('./dist/schema/parseSeq').parseSeq

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
