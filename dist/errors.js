"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.YAMLWarning = exports.YAMLSyntaxError = exports.YAMLReferenceError = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _gPO = Object.getPrototypeOf || function _gPO(o) { return o.__proto__; };

var _sPO = Object.setPrototypeOf || function _sPO(o, p) { o.__proto__ = p; return o; };

var _construct = _typeof(Reflect) === "object" && Reflect.construct || function _construct(Parent, args, Class) { var Constructor, a = [null]; a.push.apply(a, args); Constructor = Parent.bind.apply(Parent, a); return _sPO(new Constructor(), Class.prototype); };

var _cache = typeof Map === "function" && new Map();

function _wrapNativeSuper(Class) { if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() {} Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writeable: true, configurable: true } }); return _sPO(Wrapper, _sPO(function Super() { return _construct(Class, arguments, _gPO(this).constructor); }, Class)); }

var YAMLReferenceError =
/*#__PURE__*/
function (_ReferenceError) {
  _inherits(YAMLReferenceError, _ReferenceError);

  function YAMLReferenceError(source, message) {
    var _this;

    _classCallCheck(this, YAMLReferenceError);

    _this = _possibleConstructorReturn(this, (YAMLReferenceError.__proto__ || Object.getPrototypeOf(YAMLReferenceError)).call(this));
    _this.name = 'YAMLReferenceError';
    _this.message = message;
    _this.source = source;
    return _this;
  }

  return YAMLReferenceError;
}(_wrapNativeSuper(ReferenceError));

exports.YAMLReferenceError = YAMLReferenceError;

var YAMLSyntaxError =
/*#__PURE__*/
function (_SyntaxError) {
  _inherits(YAMLSyntaxError, _SyntaxError);

  function YAMLSyntaxError(source, message) {
    var _this2;

    _classCallCheck(this, YAMLSyntaxError);

    _this2 = _possibleConstructorReturn(this, (YAMLSyntaxError.__proto__ || Object.getPrototypeOf(YAMLSyntaxError)).call(this));
    _this2.name = 'YAMLSyntaxError';
    _this2.message = message;
    _this2.source = source;
    return _this2;
  }

  return YAMLSyntaxError;
}(_wrapNativeSuper(SyntaxError));

exports.YAMLSyntaxError = YAMLSyntaxError;

var YAMLWarning =
/*#__PURE__*/
function (_Error) {
  _inherits(YAMLWarning, _Error);

  function YAMLWarning(source, message) {
    var _this3;

    _classCallCheck(this, YAMLWarning);

    _this3 = _possibleConstructorReturn(this, (YAMLWarning.__proto__ || Object.getPrototypeOf(YAMLWarning)).call(this));
    _this3.name = 'YAMLWarning';
    _this3.message = message;
    _this3.source = source;
    return _this3;
  }

  return YAMLWarning;
}(_wrapNativeSuper(Error));

exports.YAMLWarning = YAMLWarning;