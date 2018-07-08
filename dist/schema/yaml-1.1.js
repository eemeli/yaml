"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.boolOptions = exports.nullOptions = void 0;

var _errors = require("../errors");

var _binary = _interopRequireDefault(require("./_binary"));

var _timestamp = _interopRequireDefault(require("./_timestamp"));

var _core = require("./core");

var _failsafe = _interopRequireDefault(require("./failsafe"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var nullOptions = {
  nullStr: 'null'
};
exports.nullOptions = nullOptions;
var boolOptions = {
  trueStr: 'true',
  falseStr: 'false'
};
exports.boolOptions = boolOptions;

var _default = _failsafe.default.concat([{
  class: null,
  default: true,
  tag: 'tag:yaml.org,2002:null',
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: function resolve() {
    return null;
  },
  options: nullOptions,
  stringify: function stringify() {
    return nullOptions.nullStr;
  }
}, {
  class: Boolean,
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
  resolve: function resolve() {
    return true;
  },
  options: boolOptions,
  stringify: function stringify(_ref) {
    var value = _ref.value;
    return value ? boolOptions.trueStr : boolOptions.falseStr;
  }
}, {
  class: Boolean,
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/i,
  resolve: function resolve() {
    return false;
  },
  options: boolOptions,
  stringify: function stringify(_ref2) {
    var value = _ref2.value;
    return value ? boolOptions.trueStr : boolOptions.falseStr;
  }
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'BIN',
  test: /^0b([0-1_]+)$/,
  resolve: function resolve(str, bin) {
    return parseInt(bin.replace(/_/g, ''), 2);
  },
  stringify: function stringify(_ref3) {
    var value = _ref3.value;
    return '0b' + value.toString(2);
  }
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'OCT',
  test: /^[-+]?0([0-7_]+)$/,
  resolve: function resolve(str, oct) {
    return parseInt(oct.replace(/_/g, ''), 8);
  },
  stringify: function stringify(_ref4) {
    var value = _ref4.value;
    return (value < 0 ? '-0' : '0') + value.toString(8);
  }
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  test: /^[-+]?[0-9][0-9_]*$/,
  resolve: function resolve(str) {
    return parseInt(str.replace(/_/g, ''), 10);
  },
  stringify: _core.stringifyNumber
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'HEX',
  test: /^0x([0-9a-fA-F_]+)$/,
  resolve: function resolve(str, hex) {
    return parseInt(hex.replace(/_/g, ''), 16);
  },
  stringify: function stringify(_ref5) {
    var value = _ref5.value;
    return (value < 0 ? '-0x' : '0x') + value.toString(16);
  }
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^(?:[-+]?\.inf|(\.nan))$/i,
  resolve: function resolve(str, nan) {
    return nan ? NaN : str[0] === '-' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  },
  stringify: _core.stringifyNumber
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^[-+]?([0-9][0-9_]*)?\.[0-9_]*([eE][-+]?[0-9]+)?$/,
  resolve: function resolve(str) {
    return parseFloat(str.replace(/_/g, ''));
  },
  stringify: _core.stringifyNumber
}], _timestamp.default, _binary.default);

exports.default = _default;