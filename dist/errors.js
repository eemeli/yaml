"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.YAMLWarning = exports.YAMLSyntaxError = exports.YAMLSemanticError = exports.YAMLReferenceError = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } _setPrototypeOf(subClass.prototype, superClass && superClass.prototype); if (superClass) _setPrototypeOf(subClass, superClass); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() {} Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, _setPrototypeOf(function Super() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); }, Class)); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (typeof Reflect !== "undefined" && Reflect.construct) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Parent.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.getPrototypeOf || function _getPrototypeOf(o) { return o.__proto__; }; return _getPrototypeOf(o); }

var YAMLReferenceError =
/*#__PURE__*/
function (_ReferenceError) {
  function YAMLReferenceError(source, message) {
    var _this;

    _classCallCheck(this, YAMLReferenceError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(YAMLReferenceError).call(this));
    _this.name = 'YAMLReferenceError';
    _this.message = message;
    _this.source = source;
    return _this;
  }

  _inherits(YAMLReferenceError, _ReferenceError);

  return YAMLReferenceError;
}(_wrapNativeSuper(ReferenceError));

exports.YAMLReferenceError = YAMLReferenceError;

var YAMLSemanticError =
/*#__PURE__*/
function (_SyntaxError) {
  function YAMLSemanticError(source, message) {
    var _this2;

    _classCallCheck(this, YAMLSemanticError);

    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(YAMLSemanticError).call(this));
    _this2.name = 'YAMLSemanticError';
    _this2.message = message;
    _this2.source = source;
    return _this2;
  }

  _inherits(YAMLSemanticError, _SyntaxError);

  return YAMLSemanticError;
}(_wrapNativeSuper(SyntaxError));

exports.YAMLSemanticError = YAMLSemanticError;

var YAMLSyntaxError =
/*#__PURE__*/
function (_SyntaxError2) {
  function YAMLSyntaxError(source, message) {
    var _this3;

    _classCallCheck(this, YAMLSyntaxError);

    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(YAMLSyntaxError).call(this));
    _this3.name = 'YAMLSyntaxError';
    _this3.message = message;
    _this3.source = source;
    return _this3;
  }

  _inherits(YAMLSyntaxError, _SyntaxError2);

  return YAMLSyntaxError;
}(_wrapNativeSuper(SyntaxError));

exports.YAMLSyntaxError = YAMLSyntaxError;

var YAMLWarning =
/*#__PURE__*/
function (_Error) {
  function YAMLWarning(source, message) {
    var _this4;

    _classCallCheck(this, YAMLWarning);

    _this4 = _possibleConstructorReturn(this, _getPrototypeOf(YAMLWarning).call(this));
    _this4.name = 'YAMLWarning';
    _this4.message = message;
    _this4.source = source;
    return _this4;
  }

  _inherits(YAMLWarning, _Error);

  return YAMLWarning;
}(_wrapNativeSuper(Error));

exports.YAMLWarning = YAMLWarning;