"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Node2 = require("../cst/Node");

var _toJSON2 = _interopRequireDefault(require("../toJSON"));

var _Node3 = _interopRequireDefault(require("./Node"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Alias =
/*#__PURE__*/
function (_Node) {
  _inherits(Alias, _Node);

  _createClass(Alias, null, [{
    key: "stringify",
    value: function stringify(_ref, _ref2) {
      var range = _ref.range,
          source = _ref.source;
      var anchors = _ref2.anchors,
          doc = _ref2.doc,
          implicitKey = _ref2.implicitKey;
      var anchor = Object.keys(anchors).find(function (a) {
        return anchors[a] === source;
      });
      if (anchor) return "*".concat(anchor).concat(implicitKey ? ' ' : '');
      var msg = doc.anchors.getName(source) ? 'Alias node must be after source node' : 'Source node not found for alias node';
      throw new Error("".concat(msg, " [").concat(range, "]"));
    }
  }]);

  function Alias(source) {
    var _this;

    _classCallCheck(this, Alias);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Alias).call(this));
    _this.source = source;
    _this.type = _Node2.Type.ALIAS;
    return _this;
  }

  _createClass(Alias, [{
    key: "toJSON",
    value: function toJSON(arg, keep) {
      return (0, _toJSON2.default)(this.source, arg, keep);
    }
  }, {
    key: "tag",
    set: function set(t) {
      throw new Error('Alias nodes cannot have tags');
    }
  }]);

  return Alias;
}(_Node3.default);

exports.default = Alias;

_defineProperty(Alias, "default", true);