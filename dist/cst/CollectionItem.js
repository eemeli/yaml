"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _errors = require("../errors");

var _Node2 = _interopRequireWildcard(require("./Node"));

var _Range = _interopRequireDefault(require("./Range"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var CollectionItem =
/*#__PURE__*/
function (_Node) {
  _inherits(CollectionItem, _Node);

  function CollectionItem(type, props) {
    var _this;

    _classCallCheck(this, CollectionItem);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(CollectionItem).call(this, type, props));
    _this.node = null;
    return _this;
  }
  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */


  _createClass(CollectionItem, [{
    key: "parse",
    value: function parse(context, start) {
      this.context = context;
      var parseNode = context.parseNode,
          src = context.src;
      var atLineStart = context.atLineStart,
          lineStart = context.lineStart;
      if (!atLineStart && this.type === _Node2.Type.SEQ_ITEM) this.error = new _errors.YAMLSemanticError(this, 'Sequence items must not have preceding content on the same line');
      var indent = atLineStart ? start - lineStart : context.indent;

      var offset = _Node2.default.endOfWhiteSpace(src, start + 1);

      var ch = src[offset];

      while (ch === '\n' || ch === '#') {
        var next = offset + 1;

        if (ch === '#') {
          var _end = _Node2.default.endOfLine(src, next);

          this.props.push(new _Range.default(offset, _end));
          offset = _end;
        } else {
          atLineStart = true;
          lineStart = next;
          offset = _Node2.default.endOfWhiteSpace(src, next); // against spec, to match \t allowed after indicator
        }

        ch = src[offset];
      }

      if (_Node2.default.nextNodeIsIndented(ch, offset - (lineStart + indent), this.type !== _Node2.Type.SEQ_ITEM)) {
        this.node = parseNode({
          atLineStart: atLineStart,
          inCollection: false,
          indent: indent,
          lineStart: lineStart,
          parent: this
        }, offset);
        if (this.node) offset = this.node.range.end;
      } else if (lineStart > start + 1) {
        offset = lineStart - 1;
      }

      var end = this.node ? this.node.valueRange.end : offset;
      this.valueRange = new _Range.default(start, end);
      return offset;
    }
  }, {
    key: "toString",
    value: function toString() {
      var src = this.context.src,
          node = this.node,
          range = this.range,
          value = this.value;
      if (value != null) return value;
      var str = node ? src.slice(range.start, node.range.start) + String(node) : src.slice(range.start, range.end);
      return _Node2.default.addStringTerminator(src, range.end, str);
    }
  }]);

  return CollectionItem;
}(_Node2.default);

exports.default = CollectionItem;