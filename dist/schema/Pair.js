"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _addComment = _interopRequireDefault(require("../addComment"));

var _Collection = _interopRequireWildcard(require("./Collection"));

var _Scalar = _interopRequireDefault(require("./Scalar"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    value: function toString(ctx, onComment) {
      if (!ctx || !ctx.doc) return JSON.stringify(this);
      var key = this.key,
          value = this.value;
      var explicitKey = !key || key.comment || key instanceof _Collection.default;
      var _ctx = ctx,
          doc = _ctx.doc,
          indent = _ctx.indent;
      ctx = Object.assign({}, ctx, {
        implicitKey: !explicitKey,
        indent: indent + '  '
      });
      var keyComment = key && key.comment;
      var keyStr = doc.schema.stringify(key, ctx, function () {
        keyComment = null;
      });
      if (keyComment) keyStr = (0, _addComment.default)(keyStr, ctx.indent, keyComment);
      ctx.implicitKey = false;
      var valueStr = doc.schema.stringify(value, ctx, onComment);
      var vcb = value && value.commentBefore ? " #".concat(value.commentBefore.replace(/\n+(?!\n|$)/g, "$&".concat(ctx.indent, "#"))) : '';

      if (explicitKey) {
        return "? ".concat(keyStr, "\n").concat(indent, ":").concat(vcb ? "".concat(vcb, "\n").concat(ctx.indent) : ' ').concat(valueStr);
      } else if (value instanceof _Collection.default) {
        return "".concat(keyStr, ":").concat(vcb, "\n").concat(ctx.indent).concat(valueStr);
      } else {
        return "".concat(keyStr, ":").concat(vcb ? "".concat(vcb, "\n").concat(ctx.indent) : ' ').concat(valueStr);
      }
    }
  }, {
    key: "commentBefore",
    get: function get() {
      return this.key && this.key.commentBefore;
    },
    set: function set(cb) {
      if (this.key == null) this.key = new _Scalar.default(null);
      this.key.commentBefore = cb;
    }
  }, {
    key: "comment",
    get: function get() {
      return this.value && this.value.comment;
    },
    set: function set(comment) {
      if (this.value == null) this.value = new _Scalar.default(null);
      this.value.comment = comment;
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