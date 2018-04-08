"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = resolve;
exports.tokenize = exports.eval = void 0;

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

var deprecatedEval = function deprecatedEval() {
  throw new Error('The yaml API has changed, try replacing `eval(str)` with `resolve(str)[0].toJSON()`');
};

exports.eval = deprecatedEval;

var deprecatedTokenize = function deprecatedTokenize() {
  throw new Error('The yaml API has changed, see README.md for more information');
};

exports.tokenize = deprecatedTokenize;