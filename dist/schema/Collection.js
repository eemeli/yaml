"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.toJSON = void 0;

var _addComment = _interopRequireDefault(require("../addComment"));

var _errors = require("../errors");

var _Node2 = _interopRequireDefault(require("./Node"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } _setPrototypeOf(subClass.prototype, superClass && superClass.prototype); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.getPrototypeOf || function _getPrototypeOf(o) { return o.__proto__; }; return _getPrototypeOf(o); }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var toJSON = function toJSON(value) {
  return Array.isArray(value) ? value.map(toJSON) : value && _typeof(value) === 'object' && 'toJSON' in value ? value.toJSON() : value;
};

exports.toJSON = toJSON;

var Collection =
/*#__PURE__*/
function (_Node) {
  _createClass(Collection, null, [{
    key: "checkKeyLength",
    value: function checkKeyLength(doc, node, itemIdx, key, keyStart) {
      if (typeof keyStart !== 'number') return;
      var item = node.items[itemIdx];
      var keyEnd = item && item.range && item.range.start;

      if (!keyEnd) {
        for (var i = itemIdx - 1; i >= 0; --i) {
          var it = node.items[i];

          if (it && it.range) {
            keyEnd = it.range.end + 2 * (itemIdx - i);
            break;
          }
        }
      }

      if (keyEnd > keyStart + 1024) {
        var k = String(key).substr(0, 8) + '...' + String(key).substr(-8);
        doc.errors.push(new _errors.YAMLSemanticError(node, "The \"".concat(k, "\" key is too long")));
      }
    }
  }]);

  function Collection(doc) {
    var _this;

    _classCallCheck(this, Collection);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Collection).call(this));
    if (!doc) throw new Error('Document not defined for new collection');
    _this._comments = [];
    _this.doc = doc;
    _this.items = [];
    return _this;
  }

  _createClass(Collection, [{
    key: "addComment",
    value: function addComment(comment) {
      this._comments.push({
        comment: comment,
        before: this.items.length
      });
    }
  }, {
    key: "resolveComments",
    value: function resolveComments() {
      var _this2 = this;

      this._comments.forEach(function (_ref) {
        var comment = _ref.comment,
            before = _ref.before;
        var item = _this2.items[before];

        if (!item) {
          if (_this2.comment) _this2.comment += '\n' + comment;else _this2.comment = comment;
        } else {
          if (item.commentBefore) item.commentBefore += '\n' + comment;else item.commentBefore = comment;
        }
      });

      delete this._comments;
    } // overridden in implementations

  }, {
    key: "toJSON",
    value: function toJSON() {
      return null;
    }
  }, {
    key: "toString",
    value: function toString(options, onComment) {
      var _this3 = this;

      var schema = this.doc.schema;
      var blockItem = options.blockItem,
          flowChars = options.flowChars,
          indent = options.indent,
          inFlow = options.inFlow,
          itemIndent = options.itemIndent;
      var opt = {
        indent: itemIndent,
        inFlow: inFlow,
        type: null
      };
      var hasItemWithComment = false;
      var hasItemWithNewLine = false;
      var nodes = this.items.reduce(function (nodes, item, i) {
        var commentBefore = item && item.commentBefore;

        if (commentBefore) {
          hasItemWithComment = true;
          commentBefore.match(/^.*$/gm).forEach(function (line) {
            nodes.push({
              type: 'comment',
              str: "#".concat(line)
            });
          });
        }

        var comment = item && item.comment;
        if (comment) hasItemWithComment = true;
        var str = schema.stringify(_this3.doc, item, opt, function () {
          comment = null;
        });
        if (!hasItemWithNewLine && str.indexOf('\n') !== -1) hasItemWithNewLine = true;
        if (inFlow && i < _this3.items.length - 1) str += ',';
        str = (0, _addComment.default)(str, opt.indent, comment);
        nodes.push({
          type: 'item',
          str: str
        });
        return nodes;
      }, []);
      var str;

      if (nodes.length === 0) {
        str = flowChars.start + flowChars.end;
      } else if (inFlow) {
        var start = flowChars.start,
            end = flowChars.end;
        var strings = nodes.map(function (_ref2) {
          var str = _ref2.str;
          return str;
        });

        if (hasItemWithComment || hasItemWithNewLine || strings.reduce(function (sum, str) {
          return sum + str.length + 2;
        }, 2) > Collection.maxFlowStringSingleLineLength) {
          str = "".concat(start, "\n  ").concat(indent).concat(strings.join("\n  ".concat(indent)), "\n").concat(indent).concat(end);
        } else {
          str = "".concat(start, " ").concat(strings.join(' '), " ").concat(end);
        }
      } else {
        str = nodes.map(blockItem).join("\n".concat(indent));
      }

      if (this.comment) {
        if (!hasItemWithNewLine && str.indexOf('\n') === -1) str = (0, _addComment.default)(str, indent, this.comment);else str += '\n' + this.comment.replace(/^/gm, "".concat(indent, "#"));
        if (onComment) onComment();
      }

      return str;
    }
  }]);

  _inherits(Collection, _Node);

  return Collection;
}(_Node2.default);

exports.default = Collection;

_defineProperty(Collection, "maxFlowStringSingleLineLength", 60);