"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Char = exports.Type = void 0;

var _Range = _interopRequireDefault(require("./Range"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Type = {
  ALIAS: 'ALIAS',
  BLOCK_FOLDED: 'BLOCK_FOLDED',
  BLOCK_LITERAL: 'BLOCK_LITERAL',
  COMMENT: 'COMMENT',
  DIRECTIVE: 'DIRECTIVE',
  DOCUMENT: 'DOCUMENT',
  FLOW_MAP: 'FLOW_MAP',
  FLOW_SEQ: 'FLOW_SEQ',
  MAP: 'MAP',
  MAP_KEY: 'MAP_KEY',
  MAP_VALUE: 'MAP_VALUE',
  PLAIN: 'PLAIN',
  QUOTE_DOUBLE: 'QUOTE_DOUBLE',
  QUOTE_SINGLE: 'QUOTE_SINGLE',
  SEQ: 'SEQ',
  SEQ_ITEM: 'SEQ_ITEM'
};
exports.Type = Type;
var Char = {
  ANCHOR: '&',
  COMMENT: '#',
  TAG: '!',
  DIRECTIVES_END: '-',
  DOCUMENT_END: '.'
  /** Root class of all nodes */

};
exports.Char = Char;

var Node =
/*#__PURE__*/
function () {
  _createClass(Node, null, [{
    key: "addStringTerminator",
    value: function addStringTerminator(src, offset, str) {
      if (str[str.length - 1] === '\n') return str;
      var next = Node.endOfWhiteSpace(src, offset);
      return next >= src.length || src[next] === '\n' ? str + '\n' : str;
    } // ^(---|...)

  }, {
    key: "atDocumentBoundary",
    value: function atDocumentBoundary(src, offset, sep) {
      var ch0 = src[offset];
      if (!ch0) return true;
      var prev = src[offset - 1];
      if (prev && prev !== '\n') return false;

      if (sep) {
        if (ch0 !== sep) return false;
      } else {
        if (ch0 !== Char.DIRECTIVES_END && ch0 !== Char.DOCUMENT_END) return false;
      }

      var ch1 = src[offset + 1];
      var ch2 = src[offset + 2];
      if (ch1 !== ch0 || ch2 !== ch0) return false;
      var ch3 = src[offset + 3];
      return !ch3 || ch3 === '\n' || ch3 === '\t' || ch3 === ' ';
    }
  }, {
    key: "endOfIdentifier",
    value: function endOfIdentifier(src, offset) {
      var ch = src[offset];
      var isVerbatim = ch === '<';
      var notOk = isVerbatim ? ['\n', '\t', ' ', '>'] : ['\n', '\t', ' ', '[', ']', '{', '}', ','];

      while (ch && notOk.indexOf(ch) === -1) {
        ch = src[offset += 1];
      }

      if (isVerbatim && ch === '>') offset += 1;
      return offset;
    }
  }, {
    key: "endOfIndent",
    value: function endOfIndent(src, offset) {
      var ch = src[offset];

      while (ch === ' ') {
        ch = src[offset += 1];
      }

      return offset;
    }
  }, {
    key: "endOfLine",
    value: function endOfLine(src, offset) {
      var ch = src[offset];

      while (ch && ch !== '\n') {
        ch = src[offset += 1];
      }

      return offset;
    }
  }, {
    key: "endOfWhiteSpace",
    value: function endOfWhiteSpace(src, offset) {
      var ch = src[offset];

      while (ch === '\t' || ch === ' ') {
        ch = src[offset += 1];
      }

      return offset;
    }
  }, {
    key: "startOfLine",
    value: function startOfLine(src, offset) {
      var ch = src[offset - 1];

      while (ch && ch !== '\n') {
        ch = src[offset -= 1];
      }

      return offset + 1;
    }
    /**
     * End of indentation, or null if the line's indent level is not more
     * than `indent`
     *
     * @param {string} src
     * @param {number} indent
     * @param {number} lineStart
     * @returns {?number}
     */

  }, {
    key: "endOfBlockIndent",
    value: function endOfBlockIndent(src, indent, lineStart) {
      var inEnd = Node.endOfIndent(src, lineStart);

      if (inEnd > lineStart + indent) {
        return inEnd;
      } else {
        var wsEnd = Node.endOfWhiteSpace(src, inEnd);
        var ch = src[wsEnd];
        if (!ch || ch === '\n') return wsEnd;
      }

      return null;
    }
  }, {
    key: "atBlank",
    value: function atBlank(src, offset) {
      var ch = src[offset];
      return ch === '\n' || ch === '\t' || ch === ' ';
    }
  }, {
    key: "atCollectionItem",
    value: function atCollectionItem(src, offset) {
      var ch = src[offset];
      return (ch === '?' || ch === ':' || ch === '-') && Node.atBlank(src, offset + 1);
    }
  }, {
    key: "nextNodeIsIndented",
    value: function nextNodeIsIndented(ch, indentDiff, indicatorAsIndent) {
      if (!ch || indentDiff < 0) return false;
      if (indentDiff > 0) return true;
      return indicatorAsIndent && ch === '-';
    } // should be at line or string end, or at next non-whitespace char

  }, {
    key: "normalizeOffset",
    value: function normalizeOffset(src, offset) {
      var ch = src[offset];
      return !ch ? offset : ch !== '\n' && src[offset - 1] === '\n' ? offset - 1 : Node.endOfWhiteSpace(src, offset);
    } // fold single newline into space, multiple newlines to N - 1 newlines
    // presumes src[offset] === '\n'

  }, {
    key: "foldNewline",
    value: function foldNewline(src, offset, indent) {
      var inCount = 0;
      var error = false;
      var fold = '';
      var ch = src[offset + 1];

      while (ch === ' ' || ch === '\t' || ch === '\n') {
        switch (ch) {
          case '\n':
            inCount = 0;
            offset += 1;
            fold += '\n';
            break;

          case '\t':
            if (inCount <= indent) error = true;
            offset = Node.endOfWhiteSpace(src, offset + 2) - 1;
            break;

          case ' ':
            inCount += 1;
            offset += 1;
            break;
        }

        ch = src[offset + 1];
      }

      if (!fold) fold = ' ';
      if (ch && inCount <= indent) error = true;
      return {
        fold: fold,
        offset: offset,
        error: error
      };
    }
  }]);

  function Node(type, props, context) {
    _classCallCheck(this, Node);

    this.context = context || null;
    this.error = null;
    this.range = null;
    this.valueRange = null;
    this.props = props || [];
    this.type = type;
    this.value = null;
  }

  _createClass(Node, [{
    key: "getPropValue",
    value: function getPropValue(idx, key, skipKey) {
      if (!this.context) return null;
      var src = this.context.src;
      var prop = this.props[idx];
      return prop && src[prop.start] === key ? src.slice(prop.start + (skipKey ? 1 : 0), prop.end) : null;
    }
  }, {
    key: "commentHasRequiredWhitespace",
    value: function commentHasRequiredWhitespace(start) {
      var src = this.context.src;
      if (this.header && start === this.header.end) return false;

      if (this.valueRange) {
        var end = this.valueRange.end;
        return start !== end || Node.atBlank(src, end - 1);
      }
    }
  }, {
    key: "parseComment",
    value: function parseComment(start) {
      var src = this.context.src;

      if (src[start] === Char.COMMENT) {
        var end = Node.endOfLine(src, start + 1);
        var commentRange = new _Range.default(start, end);
        this.props.push(commentRange);
        return end;
      }

      return start;
    }
  }, {
    key: "toString",
    value: function toString() {
      var src = this.context.src,
          range = this.range,
          value = this.value;
      if (value != null) return value;
      var str = src.slice(range.start, range.end);
      return Node.addStringTerminator(src, range.end, str);
    }
  }, {
    key: "anchor",
    get: function get() {
      for (var i = 0; i < this.props.length; ++i) {
        var anchor = this.getPropValue(i, Char.ANCHOR, true);
        if (anchor != null) return anchor;
      }

      return null;
    }
  }, {
    key: "comment",
    get: function get() {
      var comments = [];

      for (var i = 0; i < this.props.length; ++i) {
        var comment = this.getPropValue(i, Char.COMMENT, true);
        if (comment != null) comments.push(comment);
      }

      return comments.length > 0 ? comments.join('\n') : null;
    }
  }, {
    key: "hasComment",
    get: function get() {
      if (this.context) {
        var src = this.context.src;

        for (var i = 0; i < this.props.length; ++i) {
          if (src[this.props[i].start] === Char.COMMENT) return true;
        }
      }

      return false;
    }
  }, {
    key: "hasProps",
    get: function get() {
      if (this.context) {
        var src = this.context.src;

        for (var i = 0; i < this.props.length; ++i) {
          if (src[this.props[i].start] !== Char.COMMENT) return true;
        }
      }

      return false;
    }
  }, {
    key: "jsonLike",
    get: function get() {
      var jsonLikeTypes = [Type.FLOW_MAP, Type.FLOW_SEQ, Type.QUOTE_DOUBLE, Type.QUOTE_SINGLE];
      return jsonLikeTypes.indexOf(this.type) !== -1;
    }
  }, {
    key: "rawValue",
    get: function get() {
      if (!this.valueRange || !this.context) return null;
      var _this$valueRange = this.valueRange,
          start = _this$valueRange.start,
          end = _this$valueRange.end;
      return this.context.src.slice(start, end);
    }
  }, {
    key: "tag",
    get: function get() {
      for (var i = 0; i < this.props.length; ++i) {
        var tag = this.getPropValue(i, Char.TAG, false);

        if (tag != null) {
          if (tag[1] === '<') {
            return {
              verbatim: tag.slice(2, -1)
            };
          } else {
            var _tag$match = tag.match(/^(.*!)([^!]*)$/),
                _tag$match2 = _slicedToArray(_tag$match, 3),
                _ = _tag$match2[0],
                handle = _tag$match2[1],
                suffix = _tag$match2[2];

            return {
              handle: handle,
              suffix: suffix
            };
          }
        }
      }

      return null;
    }
  }, {
    key: "valueRangeContainsNewline",
    get: function get() {
      if (!this.valueRange || !this.context) return false;
      var _this$valueRange2 = this.valueRange,
          start = _this$valueRange2.start,
          end = _this$valueRange2.end;
      var src = this.context.src;

      for (var i = start; i < end; ++i) {
        if (src[i] === '\n') return true;
      }

      return false;
    }
  }]);

  return Node;
}();

exports.default = Node;