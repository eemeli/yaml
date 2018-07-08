"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _errors = require("../errors");

var _Comment = _interopRequireDefault(require("./Comment"));

var _Node2 = _interopRequireWildcard(require("./Node"));

var _Range = _interopRequireDefault(require("./Range"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

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

var FlowCollection =
/*#__PURE__*/
function (_Node) {
  _inherits(FlowCollection, _Node);

  function FlowCollection(type, props) {
    var _this;

    _classCallCheck(this, FlowCollection);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(FlowCollection).call(this, type, props));
    _this.items = null;
    return _this;
  }

  _createClass(FlowCollection, [{
    key: "prevNodeIsJsonLike",
    value: function prevNodeIsJsonLike() {
      var idx = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.items.length;
      var node = this.items[idx - 1];
      return !!node && (node.jsonLike || node.type === _Node2.Type.COMMENT && this.nodeIsJsonLike(idx - 1));
    }
    /**
     * @param {ParseContext} context
     * @param {number} start - Index of first character
     * @returns {number} - Index of the character after this
     */

  }, {
    key: "parse",
    value: function parse(context, start) {
      this.context = context;
      var parseNode = context.parseNode,
          src = context.src;
      var indent = context.indent,
          lineStart = context.lineStart;
      var ch = src[start]; // { or [

      this.items = [ch];

      var offset = _Node2.default.endOfWhiteSpace(src, start + 1);

      ch = src[offset];

      while (ch && ch !== ']' && ch !== '}') {
        switch (ch) {
          case '\n':
            {
              lineStart = offset + 1;
              offset = _Node2.default.endOfIndent(src, lineStart);
              if (offset - lineStart <= indent) this.error = new _errors.YAMLSemanticError(this, 'Insufficient indentation in flow collection');
            }
            break;

          case ',':
            {
              this.items.push(ch);
              offset += 1;
            }
            break;

          case '#':
            {
              var comment = new _Comment.default();
              offset = comment.parse({
                src: src
              }, offset);
              this.items.push(comment);
            }
            break;

          case '?':
          case ':':
            {
              var next = src[offset + 1];

              if (next === '\n' || next === '\t' || next === ' ' || next === ',' || // in-flow : after JSON-like key does not need to be followed by whitespace
              ch === ':' && this.prevNodeIsJsonLike()) {
                this.items.push(ch);
                offset += 1;
                break;
              } // fallthrough

            }

          default:
            {
              var node = parseNode({
                atLineStart: false,
                inCollection: false,
                inFlow: true,
                indent: -1,
                lineStart: lineStart,
                parent: this
              }, offset);

              if (!node) {
                // at next document start
                this.valueRange = new _Range.default(start, offset);
                return offset;
              }

              this.items.push(node);
              offset = _Node2.default.normalizeOffset(src, node.range.end);
            }
        }

        offset = _Node2.default.endOfWhiteSpace(src, offset);
        ch = src[offset];
      }

      this.valueRange = new _Range.default(start, offset + 1);

      if (ch) {
        this.items.push(ch);
        offset = _Node2.default.endOfWhiteSpace(src, offset + 1);
        offset = this.parseComment(offset);
      }

      return offset;
    }
  }, {
    key: "toString",
    value: function toString() {
      var src = this.context.src,
          items = this.items,
          range = this.range,
          value = this.value;
      if (value != null) return value;
      var nodes = items.filter(function (item) {
        return item instanceof _Node2.default;
      });
      var str = '';
      var prevEnd = range.start;
      nodes.forEach(function (node) {
        var prefix = src.slice(prevEnd, node.range.start);
        prevEnd = node.range.end;
        str += prefix + String(node);
      });
      str += src.slice(prevEnd, range.end);
      return _Node2.default.addStringTerminator(src, range.end, str);
    }
  }]);

  return FlowCollection;
}(_Node2.default);

exports.default = FlowCollection;