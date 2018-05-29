"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = resolveValue;

var _Map = _interopRequireDefault(require("./schema/Map"));

var _Pair = _interopRequireDefault(require("./schema/Pair"));

var _Scalar = _interopRequireDefault(require("./schema/Scalar"));

var _Seq = _interopRequireDefault(require("./schema/Seq"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function resolveValue(doc, value, wrapScalars) {
  if (value == null) return new _Scalar.default(null);
  if (_typeof(value) !== 'object') return wrapScalars ? new _Scalar.default(value) : value;

  if (Array.isArray(value)) {
    var seq = new _Seq.default(doc);
    seq.items = value.map(function (v) {
      return resolveValue(doc, v, wrapScalars);
    });
    return seq;
  } else {
    var map = new _Map.default(doc);
    map.items = Object.keys(value).map(function (key) {
      var k = resolveValue(doc, key, wrapScalars);
      var v = resolveValue(doc, value[key], wrapScalars);
      return new _Pair.default(k, v);
    });
    return map;
  }
}