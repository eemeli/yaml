"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Collection2 = _interopRequireWildcard(require("./Collection"));

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
    key: "toJSON",
    value: function toJSON() {
      return this.items.map(_Collection2.toJSON);
    }
  }, {
    key: "toString",
    value: function toString() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          doc = _ref.doc,
          _ref$indent = _ref.indent,
          indent = _ref$indent === void 0 ? '' : _ref$indent,
          _ref$inFlow = _ref.inFlow,
          inFlow = _ref$inFlow === void 0 ? false : _ref$inFlow;

      var onComment = arguments.length > 1 ? arguments[1] : undefined;
      return _get(_getPrototypeOf(YAMLSeq.prototype), "toString", this).call(this, {
        blockItem: function blockItem(_ref2) {
          var type = _ref2.type,
              str = _ref2.str;
          return type === 'comment' ? str : "- ".concat(str);
        },
        doc: doc,
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