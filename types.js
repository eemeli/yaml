var opt = require('./dist/tags/options')
exports.boolOptions = opt.boolOptions
exports.nullOptions = opt.nullOptions
exports.strOptions = opt.strOptions

exports.Schema = require('./dist/schema').default
exports.YAMLMap = require('./dist/schema/Map').default
exports.YAMLSeq = require('./dist/schema/Seq').default
exports.Pair = require('./dist/schema/Pair').default
exports.Scalar = require('./dist/schema/Scalar').default

exports.binary = require('./dist/tags/yaml-1.1/binary').default
exports.omap = require('./dist/tags/yaml-1.1/omap').default
exports.pairs = require('./dist/tags/yaml-1.1/pairs').default
exports.set = require('./dist/tags/yaml-1.1/set').default

var ts = require('./dist/tags/yaml-1.1/timestamp')
exports.floatTime = ts.floatTime
exports.intTime = ts.intTime
exports.timestamp = ts.timestamp
