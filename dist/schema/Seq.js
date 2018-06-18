"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Node = require("../ast/Node");

var _errors = require("../errors");

var _Collection2 = _interopRequireWildcard(require("./Collection"));

var _Pair = _interopRequireDefault(require("./Pair"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } _setPrototypeOf(subClass.prototype, superClass && superClass.prototype); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.getPrototypeOf || function _getPrototypeOf(o) { return o.__proto__; }; return _getPrototypeOf(o); }

var YAMLSeq =
/*#__PURE__*/
function (_Collection) {
  function YAMLSeq() {
    _classCallCheck(this, YAMLSeq);

    return _possibleConstructorReturn(this, _getPrototypeOf(YAMLSeq).apply(this, arguments));
  }

  _createClass(YAMLSeq, [{
    key: "parse",
    value: function parse(ast) {
      ast.resolved = this;

      if (ast.type === _Node.Type.FLOW_SEQ) {
        this.resolveFlowSeqItems(ast);
      } else {
        this.resolveBlockSeqItems(ast);
      }

      this.resolveComments();
      return this;
    }
  }, {
    key: "resolveBlockSeqItems",
    value: function resolveBlockSeqItems(seq) {
      for (var i = 0; i < seq.items.length; ++i) {
        var item = seq.items[i];

        switch (item.type) {
          case _Node.Type.COMMENT:
            this.addComment(item.comment);
            break;

          case _Node.Type.SEQ_ITEM:
            if (item.error) this.doc.errors.push(item.error);
            this.items.push(this.doc.resolveNode(item.node));
            if (item.hasProps) this.doc.errors.push(new _errors.YAMLSemanticError(item, 'Sequence items cannot have tags or anchors before the - indicator'));
            break;

          default:
            this.doc.errors.push(new _errors.YAMLSyntaxError(item, "Unexpected ".concat(item.type, " node in sequence")));
        }
      }
    }
  }, {
    key: "resolveFlowSeqItems",
    value: function resolveFlowSeqItems(seq) {
      var explicitKey = false;
      var key = undefined;
      var keyStart = null;
      var next = '[';

      for (var i = 0; i < seq.items.length; ++i) {
        var item = seq.items[i];

        if (typeof item === 'string') {
          if (item !== ':' && (explicitKey || key !== undefined)) {
            if (explicitKey && key === undefined) key = null;
            this.items.push(new _Pair.default(key));
            explicitKey = false;
            key = undefined;
            keyStart = null;
          }

          if (item === next) {
            next = null;
          } else if (!next && item === '?') {
            explicitKey = true;
          } else if (next !== '[' && item === ':' && key === undefined) {
            if (next === ',') {
              key = this.items.pop();
              if (key instanceof _Pair.default) this.doc.errors.push(new _errors.YAMLSemanticError(item, 'Chaining flow sequence pairs is invalid (e.g. [ a : b : c ])'));
              if (!explicitKey) _Collection2.default.checkKeyLength(this.doc, seq, i, key, keyStart);
            } else {
              key = null;
            }

            keyStart = null;
            explicitKey = false; // TODO: add error for non-explicit multiline plain key

            next = null;
          } else if (next === '[' || item !== ']' || i < seq.items.length - 1) {
            this.doc.errors.push(new _errors.YAMLSyntaxError(seq, "Flow sequence contains an unexpected ".concat(item)));
          }
        } else if (item.type === _Node.Type.COMMENT) {
          this.addComment(item.comment);
        } else {
          if (next) this.doc.errors.push(new _errors.YAMLSemanticError(item, "Expected a ".concat(next, " here in flow sequence")));
          var value = this.doc.resolveNode(item);

          if (key === undefined) {
            this.items.push(value);
          } else {
            this.items.push(new _Pair.default(key, value));
            key = undefined;
          }

          keyStart = item.range.start;
          next = ',';
        }
      }

      if (seq.items[seq.items.length - 1] !== ']') this.doc.errors.push(new _errors.YAMLSemanticError(seq, 'Expected flow sequence to end with ]'));
      if (key !== undefined) this.items.push(new _Pair.default(key));
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.items.map(_Collection2.toJSON);
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var inFlow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var onComment = arguments.length > 2 ? arguments[2] : undefined;
      return _get(_getPrototypeOf(YAMLSeq.prototype), "toString", this).call(this, {
        blockItem: function blockItem(_ref) {
          var type = _ref.type,
              str = _ref.str;
          return type === 'comment' ? str : "- ".concat(str);
        },
        flowChars: {
          start: '[',
          end: ']'
        },
        indent: indent,
        inFlow: inFlow,
        itemIndent: indent + (inFlow ? '    ' : '  ')
      }, onComment);
    }
  }]);

  _inherits(YAMLSeq, _Collection);

  return YAMLSeq;
}(_Collection2.default);

exports.default = YAMLSeq;