"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.toJSON = void 0;

var _addComment = _interopRequireDefault(require("../addComment"));

var _Node2 = _interopRequireDefault(require("./Node"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } _setPrototypeOf(subClass.prototype, superClass && superClass.prototype); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.getPrototypeOf || function _getPrototypeOf(o) { return o.__proto__; }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var toJSON = function toJSON(value) {
  return Array.isArray(value) ? value.map(toJSON) : value && _typeof(value) === 'object' && 'toJSON' in value ? value.toJSON() : value;
};

exports.toJSON = toJSON;

var Collection =
/*#__PURE__*/
function (_Node) {
  function Collection() {
    var _getPrototypeOf2;

    var _temp, _this;

    _classCallCheck(this, Collection);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _possibleConstructorReturn(_this, (_temp = _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(Collection)).call.apply(_getPrototypeOf2, [this].concat(args))), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "items", []), _temp));
  }

  _createClass(Collection, [{
    key: "toJSON",
    // overridden in implementations
    value: function toJSON() {
      return null;
    }
  }, {
    key: "toString",
    value: function toString(_ref, onComment) {
      var _this2 = this;

      var blockItem = _ref.blockItem,
          doc = _ref.doc,
          flowChars = _ref.flowChars,
          indent = _ref.indent,
          inFlow = _ref.inFlow,
          itemIndent = _ref.itemIndent;
      if (!doc) return JSON.stringify(this);
      var ctx = {
        doc: doc,
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
        var str = doc.schema.stringify(item, ctx, function () {
          comment = null;
        });
        if (!hasItemWithNewLine && str.indexOf('\n') !== -1) hasItemWithNewLine = true;
        if (inFlow && i < _this2.items.length - 1) str += ',';
        str = (0, _addComment.default)(str, ctx.indent, comment);
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