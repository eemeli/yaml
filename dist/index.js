"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = resolve;

var _rawYaml = _interopRequireDefault(require("raw-yaml"));

var _Document = _interopRequireDefault(require("./Document"));

var _Tags = _interopRequireDefault(require("./Tags"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function resolve(src) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var ast = (0, _rawYaml.default)(src);
  var tags = new _Tags.default(options);
  return ast.map(function (doc) {
    return new _Document.default(tags, doc, options);
  });
}