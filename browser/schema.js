module.exports = require('./dist/doc/Schema').Schema
const opt = require('./dist/tags/options')
module.exports.nullOptions = opt.nullOptions
module.exports.strOptions = opt.strOptions
module.exports.stringify = require('./dist/stringify/stringifyString').stringifyString

require('./dist/warnings').warnFileDeprecation(__filename)
