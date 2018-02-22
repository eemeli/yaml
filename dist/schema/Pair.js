"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Collection = _interopRequireWildcard(require("./Collection"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Pair =
/*#__PURE__*/
function () {
  function Pair(key) {
    var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, Pair);

    this.key = key;
    this.value = value;
  }

  _createClass(Pair, [{
    key: "toJSON",
    value: function toJSON() {
      var pair = {};
      pair[this.stringKey] = (0, _Collection.toJSON)(this.value);
      return pair;
    }
  }, {
    key: "toString",
    value: function toString(tags, options) {
      if (!tags) return JSON.stringify(this);
      var key = this.key,
          value = this.value;
      var indent = options.indent;
      var opt = Object.assign({}, options, {
        implicitKey: true
      });
      opt.indent += '  ';
      var keyStr = tags.stringify(key, opt);
      opt.implicitKey = false;
      var valueStr = tags.stringify(value, opt);

      if (key instanceof _Collection.default) {
        return "? ".concat(keyStr, "\n").concat(indent, ": ").concat(valueStr);
      } else if (value instanceof _Collection.default) {
        return "".concat(keyStr, ":\n").concat(opt.indent).concat(valueStr);
      } else {
        return "".concat(keyStr, ": ").concat(valueStr);
      }
    }
  }, {
    key: "stringKey",
    get: function get() {
      var key = (0, _Collection.toJSON)(this.key);
      if (key === null) return '';
      if (_typeof(key) === 'object') try {
        return JSON.stringify(key);
      } catch (e) {
        /* should not happen, but let's ignore in any case */
      }
      return String(key);
    }
  }]);

  return Pair;
}();

exports.default = Pair;