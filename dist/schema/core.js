"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.nullOptions = exports.stringifyNumber = void 0;

var _failsafe = _interopRequireDefault(require("./failsafe"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var stringifyNumber = function stringifyNumber(_ref) {
  var value = _ref.value;
  return isFinite(value) ? JSON.stringify(value) : isNaN(value) ? '.nan' : value < 0 ? '-.inf' : '.inf';
};

exports.stringifyNumber = stringifyNumber;
var nullOptions = {
  nullStr: 'null'
};
exports.nullOptions = nullOptions;

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
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: function resolve(str) {
    return str[0] === 't' || str[0] === 'T';
  }
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'OCT',
  test: /^0o([0-7]+)$/,
  resolve: function resolve(str, oct) {
    return parseInt(oct, 8);
  },
  stringify: function stringify(_ref2) {
    var value = _ref2.value;
    return '0o' + value.toString(8);
  }
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  test: /^[-+]?[0-9]+$/,
  resolve: function resolve(str) {
    return parseInt(str, 10);
  },
  stringify: stringifyNumber
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'HEX',
  test: /^0x([0-9a-fA-F]+)$/,
  resolve: function resolve(str, hex) {
    return parseInt(hex, 16);
  },
  stringify: function stringify(_ref3) {
    var value = _ref3.value;
    return '0x' + value.toString(16);
  }
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^(?:[-+]?\.inf|(\.nan))$/i,
  resolve: function resolve(str, nan) {
    return nan ? NaN : str[0] === '-' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  },
  stringify: stringifyNumber
}, {
  class: Number,
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^[-+]?(0|[1-9][0-9]*)(\.[0-9]*)?([eE][-+]?[0-9]+)?$/,
  resolve: function resolve(str) {
    return parseFloat(str);
  },
  stringify: stringifyNumber
}]);

exports.default = _default;