"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = resolve;

var _parse = _interopRequireDefault(require("./ast/parse"));

var _Document = _interopRequireDefault(require("./Document"));

var _Tags = _interopRequireDefault(require("./Tags"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function resolve(src) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var ast = (0, _parse.default)(src);
  var tags = new _Tags.default(options);
  return ast.map(function (doc) {
    return new _Document.default(tags, doc, options);
  });
}