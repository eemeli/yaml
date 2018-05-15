"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveValue = exports.addComment = void 0;

var _Map = _interopRequireDefault(require("./schema/Map"));

var _Pair = _interopRequireDefault(require("./schema/Pair"));

var _Scalar = _interopRequireDefault(require("./schema/Scalar"));

var _Seq = _interopRequireDefault(require("./schema/Seq"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var addComment = function addComment(str, indent, comment) {
  return !comment ? str : comment.indexOf('\n') === -1 ? "".concat(str, " #").concat(comment) : "".concat(str, "\n") + comment.replace(/^/gm, "".concat(indent || '', "#"));
};

exports.addComment = addComment;

var resolveValue = function resolveValue(doc, value) {
  if (value == null) return new _Scalar.default(null);
  if (_typeof(value) !== 'object') return new _Scalar.default(value);

  if (Array.isArray(value)) {
    var seq = new _Seq.default(doc);
    seq.items = value.map(function (v) {
      return resolveValue(doc, v);
    });
    return seq;
  } else {
    var map = new _Map.default(doc);
    map.items = Object.keys(value).map(function (k) {
      var key = resolveValue(doc, k);
      var value = resolveValue(doc, value[k]);
      return new _Pair.default(key, value);
    });
    return map;
  }
};

exports.resolveValue = resolveValue;