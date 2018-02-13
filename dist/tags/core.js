"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Map = _interopRequireDefault(require("./Map"));

var _Seq = _interopRequireDefault(require("./Seq"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = [{
  tag: 'tag:yaml.org,2002:map',
  resolve: function resolve(doc, node) {
    return new _Map.default(doc, node);
  }
}, {
  tag: 'tag:yaml.org,2002:seq',
  resolve: function resolve(doc, node) {
    return new _Seq.default(doc, node);
  }
}, {
  tag: 'tag:yaml.org,2002:str',
  resolve: function resolve(doc, node) {
    return node.strValue || '';
  }
}, {
  tag: 'tag:yaml.org,2002:null',
  test: /^(?:~|null)?$/i,
  resolve: function resolve() {
    return null;
  }
}, {
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:true|false)$/i,
  resolve: function resolve(str) {
    return str[0] === 't' || str[0] === 'T';
  }
}, {
  tag: 'tag:yaml.org,2002:int',
  test: /^0o([0-7]+)$/,
  resolve: function resolve(str, oct) {
    return parseInt(oct, 8);
  }
}, {
  tag: 'tag:yaml.org,2002:int',
  test: /^[-+]?[0-9]+$/,
  resolve: function resolve(str) {
    return parseInt(str, 10);
  }
}, {
  tag: 'tag:yaml.org,2002:int',
  test: /^0x([0-9a-fA-F]+)$/,
  resolve: function resolve(str, hex) {
    return parseInt(hex, 16);
  }
}, {
  tag: 'tag:yaml.org,2002:float',
  test: /^(?:[-+]?\.inf|(\.nan))$/i,
  resolve: function resolve(str, nan) {
    return nan ? NaN : str[0] === '-' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }
}, {
  tag: 'tag:yaml.org,2002:float',
  test: /^[-+]?(0|[1-9][0-9]*)(\.[0-9]*)?([eE][-+]?[0-9]+)?$/,
  resolve: function resolve(str) {
    return parseFloat(str);
  }
}];
exports.default = _default;