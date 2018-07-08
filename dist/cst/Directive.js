"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Node2 = _interopRequireWildcard(require("./Node"));

var _Range = _interopRequireDefault(require("./Range"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Directive =
/*#__PURE__*/
function (_Node) {
  _inherits(Directive, _Node);

  _createClass(Directive, null, [{
    key: "endOfDirective",
    value: function endOfDirective(src, offset) {
      var ch = src[offset];

      while (ch && ch !== '\n' && ch !== '#') {
        ch = src[offset += 1];
      } // last char can't be whitespace


      ch = src[offset - 1];

      while (ch === ' ' || ch === '\t') {
        offset -= 1;
        ch = src[offset - 1];
      }

      return offset;
    }
  }]);

  function Directive() {
    var _this;

    _classCallCheck(this, Directive);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Directive).call(this, _Node2.Type.DIRECTIVE));
    _this.name = null;
    return _this;
  }

  _createClass(Directive, [{
    key: "parseName",
    value: function parseName(start) {
      var src = this.context.src;
      var offset = start;
      var ch = src[offset];

      while (ch && ch !== '\n' && ch !== '\t' && ch !== ' ') {
        ch = src[offset += 1];
      }

      this.name = src.slice(start, offset);
      return offset;
    }
  }, {
    key: "parseParameters",
    value: function parseParameters(start) {
      var src = this.context.src;
      var offset = start;
      var ch = src[offset];

      while (ch && ch !== '\n' && ch !== '#') {
        ch = src[offset += 1];
      }

      this.valueRange = new _Range.default(start, offset);
      return offset;
    }
  }, {
    key: "parse",
    value: function parse(context, start) {
      this.context = context;
      var src = context.src;
      var offset = this.parseName(start + 1);
      offset = this.parseParameters(offset);
      offset = this.parseComment(offset);
      this.range = new _Range.default(start, offset);
      return offset;
    }
  }, {
    key: "parameters",
    get: function get() {
      var raw = this.rawValue;
      return raw ? raw.trim().split(/[ \t]+/) : [];
    }
  }]);

  return Directive;
}(_Node2.default);

exports.default = Directive;