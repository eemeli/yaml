exports.createMap = require('./dist/tags/failsafe/map').createMap
exports.createSeq = require('./dist/tags/failsafe/seq').createSeq
exports.findPair = require('./dist/schema/Map').findPair
exports.parseMap = require('./dist/schema/parseMap').default
exports.parseSeq = require('./dist/schema/parseSeq').default

exports.stringifyNumber = require('./dist/tags/core').stringifyNumber
exports.stringifyString = require('./dist/stringify').default
exports.toJSON = require('./dist/toJSON').default
exports.Type = require('./dist/cst/Node').Type

var err = require('./dist/errors')
exports.YAMLReferenceError = err.YAMLReferenceError
exports.YAMLSemanticError = err.YAMLSemanticError
exports.YAMLSyntaxError = err.YAMLSyntaxError
exports.YAMLWarning = err.YAMLWarning
