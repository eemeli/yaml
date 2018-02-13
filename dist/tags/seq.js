"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rawYaml = require("raw-yaml");

var _errors = require("../errors");

var _Collection2 = _interopRequireWildcard(require("./Collection"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

var YAMLSeq =
/*#__PURE__*/
function (_Collection) {
  _inherits(YAMLSeq, _Collection);

  function YAMLSeq(doc, node) {
    var _this;

    _classCallCheck(this, YAMLSeq);

    _this = _possibleConstructorReturn(this, (YAMLSeq.__proto__ || Object.getPrototypeOf(YAMLSeq)).call(this));
    node.resolved = _assertThisInitialized(_this);

    if (node.type === _rawYaml.Type.FLOW_SEQ) {
      _this.resolveFlowSeqItems(doc, node);
    } else {
      _this.resolveBlockSeqItems(doc, node);
    }

    return _this;
  }

  _createClass(YAMLSeq, [{
    key: "resolveBlockSeqItems",
    value: function resolveBlockSeqItems(doc, seq) {
      for (var i = 0; i < seq.items.length; ++i) {
        var item = seq.items[i];

        switch (item.type) {
          case _rawYaml.Type.COMMENT:
            this.addComment(item.comment);
            break;

          case _rawYaml.Type.SEQ_ITEM:
            this.items.push(doc.resolveNode(item.node));
            break;

          default:
            doc.errors.push(new _errors.YAMLSyntaxError(item, "Unexpected ".concat(item.type, " node in sequence")));
        }
      }
    }
  }, {
    key: "resolveFlowSeqItems",
    value: function resolveFlowSeqItems(doc, seq) {
      var explicitKey = false;
      var key = undefined;
      var next = '[';

      for (var i = 0; i < seq.items.length; ++i) {
        var item = seq.items[i];

        if (typeof item === 'string') {
          if (item !== ':' && (explicitKey || key !== undefined)) {
            if (explicitKey && key === undefined) key = null;
            this.items.push(new _Collection2.Pair(key));
            explicitKey = false;
            key = undefined;
          }

          if (item === next) {
            next = null;
          } else if (!next && item === '?') {
            explicitKey = true;
          } else if (next !== '[' && item === ':' && key === undefined) {
            key = next === ',' ? this.items.pop() : null;
            if (key instanceof _Collection2.Pair) doc.errors.push(new _errors.YAMLSyntaxError(item, 'Chaining flow sequence pairs is invalid (e.g. [ a : b : c ])'));
            explicitKey = false; // TODO: add error for non-explicit multiline plain key

            next = null;
          } else if (next === '[' || item !== ']' || i < seq.items.length - 1) {
            doc.errors.push(new _errors.YAMLSyntaxError(seq, "Flow sequence contains an unexpected ".concat(item)));
          }
        } else if (item.type === _rawYaml.Type.COMMENT) {
          this.addComment(item.comment);
        } else {
          if (next) doc.errors.push(new _errors.YAMLSyntaxError(item, "Expected a ".concat(next, " here in flow sequence")));
          var value = doc.resolveNode(item);

          if (key === undefined) {
            this.items.push(value);
          } else {
            this.items.push(new _Collection2.Pair(key, value));
            key = undefined;
          }

          next = ',';
        }
      }

      if (seq.items[seq.items.length - 1] !== ']') doc.errors.push(new _errors.YAMLSyntaxError(seq, 'Expected flow sequence to end with ]'));
      if (key !== undefined) this.items.push(new _Collection2.Pair(key));
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.items.map(_Collection2.toJSON);
    }
  }]);

  return YAMLSeq;
}(_Collection2.default);

exports.default = YAMLSeq;