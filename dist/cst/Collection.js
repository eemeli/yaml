"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _CollectionItem = _interopRequireDefault(require("./CollectionItem"));

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

var Collection =
/*#__PURE__*/
function (_Node) {
  _inherits(Collection, _Node);

  function Collection(firstItem) {
    var _this;

    _classCallCheck(this, Collection);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Collection).call(this, firstItem.type === _Node2.Type.SEQ_ITEM ? _Node2.Type.SEQ : _Node2.Type.MAP));
    _this.items = [firstItem];

    for (var i = firstItem.props.length - 1; i >= 0; --i) {
      if (firstItem.props[i].start < firstItem.context.lineStart) {
        // props on previous line are assumed by the collection
        _this.props = firstItem.props.slice(0, i + 1);
        firstItem.props = firstItem.props.slice(i + 1);
        var itemRange = firstItem.props[0] || firstItem.valueRange;
        firstItem.range.start = itemRange.start;
        break;
      }
    }

    return _this;
  }
  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */


  _createClass(Collection, [{
    key: "parse",
    value: function parse(context, start) {
      this.context = context;
      var parseNode = context.parseNode,
          src = context.src; // It's easier to recalculate lineStart here rather than tracking down the
      // last context from which to read it -- eemeli/yaml#2

      var lineStart = _Node2.default.startOfLine(src, start);

      var firstItem = this.items[0]; // First-item context needs to be correct for later comment handling
      // -- eemeli/yaml#17

      firstItem.context.parent = this;
      this.valueRange = _Range.default.copy(firstItem.valueRange);
      var indent = firstItem.range.start - firstItem.context.lineStart;
      var offset = start;
      offset = _Node2.default.normalizeOffset(src, offset);
      var ch = src[offset];
      var atLineStart = _Node2.default.endOfWhiteSpace(src, lineStart) === offset;

      while (ch) {
        while (ch === '\n' || ch === '#') {
          if (ch === '#') {
            var comment = new _Comment.default();
            offset = comment.parse({
              src: src
            }, offset);
            this.items.push(comment);
            this.valueRange.end = offset;

            if (offset >= src.length) {
              ch = null;
              break;
            }
          }

          lineStart = offset + 1;
          offset = _Node2.default.endOfIndent(src, lineStart);

          if (_Node2.default.atBlank(src, offset)) {
            var wsEnd = _Node2.default.endOfWhiteSpace(src, offset);

            var next = src[wsEnd];

            if (!next || next === '\n' || next === '#') {
              offset = wsEnd;
            }
          }

          ch = src[offset];
          atLineStart = true;
        }

        if (!ch) {
          break;
        }

        if (offset !== lineStart + indent && (atLineStart || ch !== ':')) {
          if (lineStart > start) offset = lineStart;
          break;
        }

        if (firstItem.type === _Node2.Type.SEQ_ITEM !== (ch === '-')) {
          var typeswitch = true;

          if (ch === '-') {
            // map key may start with -, as long as it's followed by a non-whitespace char
            var _next = src[offset + 1];
            typeswitch = !_next || _next === '\n' || _next === '\t' || _next === ' ';
          }

          if (typeswitch) {
            if (lineStart > start) offset = lineStart;
            break;
          }
        }

        var node = parseNode({
          atLineStart: atLineStart,
          inCollection: true,
          indent: indent,
          lineStart: lineStart,
          parent: this
        }, offset);
        if (!node) return offset; // at next document start

        this.items.push(node);
        this.valueRange.end = node.valueRange.end;
        offset = _Node2.default.normalizeOffset(src, node.range.end);
        ch = src[offset];
        atLineStart = false; // Need to reset lineStart here if preceding node's range has advanced to
        // check the current line's indentation level -- eemeli/yaml#10

        if (ch && ch !== '\n' && ch !== '#') {
          var ls = offset - 1;
          var prev = src[ls];

          while (prev === ' ' || prev === '\t') {
            prev = src[--ls];
          }

          if (prev === '\n') lineStart = ls + 1;
        }
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
      var str = src.slice(range.start, items[0].range.start) + String(items[0]);

      for (var i = 1; i < items.length; ++i) {
        var item = items[i];
        var _item$context = item.context,
            atLineStart = _item$context.atLineStart,
            indent = _item$context.indent;
        if (atLineStart) for (var _i = 0; _i < indent; ++_i) {
          str += ' ';
        }
        str += String(item);
      }

      return _Node2.default.addStringTerminator(src, range.end, str);
    }
  }]);

  return Collection;
}(_Node2.default);

exports.default = Collection;