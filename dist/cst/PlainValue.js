"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Node2 = _interopRequireDefault(require("./Node"));

var _Range = _interopRequireDefault(require("./Range"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var PlainValue =
/*#__PURE__*/
function (_Node) {
  _inherits(PlainValue, _Node);

  function PlainValue() {
    _classCallCheck(this, PlainValue);

    return _possibleConstructorReturn(this, _getPrototypeOf(PlainValue).apply(this, arguments));
  }

  _createClass(PlainValue, [{
    key: "parseBlockValue",
    value: function parseBlockValue(start) {
      var _this$context = this.context,
          indent = _this$context.indent,
          inFlow = _this$context.inFlow,
          src = _this$context.src;
      var offset = start;

      for (var ch = src[offset]; ch === '\n'; ch = src[offset]) {
        if (_Node2.default.atDocumentBoundary(src, offset + 1)) break;

        var end = _Node2.default.endOfBlockIndent(src, indent, offset + 1);

        if (end === null || src[end] === '#') break;
        offset = PlainValue.endOfLine(src, end, inFlow);
      }

      if (this.valueRange.isEmpty) this.valueRange.start = start;
      this.valueRange.end = offset;
      return offset;
    }
    /**
     * Parses a plain value from the source
     *
     * Accepted forms are:
     * ```
     * #comment
     *
     * first line
     *
     * first line #comment
     *
     * first line
     * block
     * lines
     *
     * #comment
     * block
     * lines
     * ```
     * where block lines are empty or have an indent level greater than `indent`.
     *
     * @param {ParseContext} context
     * @param {number} start - Index of first character
     * @returns {number} - Index of the character after this scalar, may be `\n`
     */

  }, {
    key: "parse",
    value: function parse(context, start) {
      this.context = context;
      var inFlow = context.inFlow,
          src = context.src;
      var offset = start;
      var ch = src[offset];

      if (ch && ch !== '#' && ch !== '\n') {
        offset = PlainValue.endOfLine(src, start, inFlow);
      }

      this.valueRange = new _Range.default(start, offset);
      offset = _Node2.default.endOfWhiteSpace(src, offset);
      offset = this.parseComment(offset);

      if (!this.hasComment || this.valueRange.isEmpty) {
        offset = this.parseBlockValue(offset);
      }

      return offset;
    }
  }, {
    key: "strValue",
    get: function get() {
      if (!this.valueRange || !this.context) return null;
      var _this$valueRange = this.valueRange,
          start = _this$valueRange.start,
          end = _this$valueRange.end;
      var src = this.context.src;
      var ch = src[end - 1];

      while (start < end && (ch === '\n' || ch === '\t' || ch === ' ')) {
        ch = src[--end - 1];
      }

      ch = src[start];

      while (start < end && (ch === '\n' || ch === '\t' || ch === ' ')) {
        ch = src[++start];
      }

      var str = '';

      for (var i = start; i < end; ++i) {
        var _ch = src[i];

        if (_ch === '\n') {
          var _Node$foldNewline = _Node2.default.foldNewline(src, i, -1),
              fold = _Node$foldNewline.fold,
              offset = _Node$foldNewline.offset;

          str += fold;
          i = offset;
        } else if (_ch === ' ' || _ch === '\t') {
          // trim trailing whitespace
          var wsStart = i;
          var next = src[i + 1];

          while (i < end && (next === ' ' || next === '\t')) {
            i += 1;
            next = src[i + 1];
          }

          if (next !== '\n') str += i > wsStart ? src.slice(wsStart, i + 1) : _ch;
        } else {
          str += _ch;
        }
      }

      return str;
    }
  }], [{
    key: "endOfLine",
    value: function endOfLine(src, start, inFlow) {
      var ch = src[start];
      var offset = start;

      while (ch && ch !== '\n') {
        if (inFlow && (ch === '[' || ch === ']' || ch === '{' || ch === '}' || ch === ',')) break;
        var next = src[offset + 1];
        if (ch === ':' && (next === '\n' || next === '\t' || next === ' ' || next === ',')) break;
        if ((ch === ' ' || ch === '\t') && next === '#') break;
        offset += 1;
        ch = next;
      }

      return offset;
    }
  }]);

  return PlainValue;
}(_Node2.default);

exports.default = PlainValue;