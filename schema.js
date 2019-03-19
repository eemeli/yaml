module.exports = require('./dist/schema').default
var opt = require('./dist/tags/options')
module.exports.nullOptions = opt.nullOptions
module.exports.strOptions = opt.strOptions
module.exports.stringify = require('./dist/stringify').stringifyString

require('./dist/deprecation').warn(__filename)
