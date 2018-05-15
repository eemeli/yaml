"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _parse = _interopRequireDefault(require("./ast/parse"));

var _Document = _interopRequireDefault(require("./Document"));

var _errors = require("./errors");

var _Tags = _interopRequireDefault(require("./Tags"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var parseStream = function parseStream(src) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var ast = (0, _parse.default)(src);
  var tags = new _Tags.default(options);
  return ast.map(function (astDoc) {
    var doc = new _Document.default(tags, options);
    return doc.parse(astDoc);
  });
};

var parse = function parse(src) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var stream = parseStream(src, options);
  stream.forEach(function (doc) {
    return doc.errors.forEach(function (error) {
      if (error instanceof _errors.YAMLWarning) {
        if (typeof console !== 'undefined') console.warn(error);
      } else {
        throw error;
      }
    });
  });
  if (options.docArray) return stream.map(function (doc) {
    return doc.toJSON();
  });

  if (stream.length > 1) {
    throw new Error('Source contains multiple documents; set options.docArray = true or use parseStream()');
  }

  return stream[0] && stream[0].toJSON();
};

var _default = {
  Document: _Document.default,
  parse: parse,
  parseAST: _parse.default,
  parseStream: parseStream
};
exports.default = _default;