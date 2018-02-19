"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.seq = exports.map = void 0;

var _rawYaml = require("raw-yaml");

var _Map = _interopRequireDefault(require("./Map"));

var _Seq = _interopRequireDefault(require("./Seq"));

var _string = require("./_string");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var map = {
  class: _Map.default,
  tag: 'tag:yaml.org,2002:map',
  resolve: function resolve(doc, node) {
    return new _Map.default(doc, node);
  },
  stringify: function stringify(value, _ref) {
    var indent = _ref.indent,
        inFlow = _ref.inFlow;
    return value.toString(indent, inFlow);
  }
};
exports.map = map;
var seq = {
  class: _Seq.default,
  tag: 'tag:yaml.org,2002:seq',
  resolve: function resolve(doc, node) {
    return new _Seq.default(doc, node);
  },
  stringify: function stringify(value, _ref2) {
    var indent = _ref2.indent,
        inFlow = _ref2.inFlow;
    return value.toString(indent, inFlow);
  }
};
exports.seq = seq;
var _default = [map, seq, _string.str];
exports.default = _default;