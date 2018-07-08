"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createNode;

var _Map = _interopRequireDefault(require("./schema/Map"));

var _Pair = _interopRequireDefault(require("./schema/Pair"));

var _Scalar = _interopRequireDefault(require("./schema/Scalar"));

var _Seq = _interopRequireDefault(require("./schema/Seq"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function createNode(value) {
  var wrapScalars = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  if (value == null) return new _Scalar.default(null);
  if (_typeof(value) !== 'object') return wrapScalars ? new _Scalar.default(value) : value;

  if (Array.isArray(value)) {
    var seq = new _Seq.default();
    seq.items = value.map(function (v) {
      return createNode(v, wrapScalars);
    });
    return seq;
  } else {
    var map = new _Map.default();
    map.items = Object.keys(value).map(function (key) {
      var k = createNode(key, wrapScalars);
      var v = createNode(value[key], wrapScalars);
      return new _Pair.default(k, v);
    });
    return map;
  }
}