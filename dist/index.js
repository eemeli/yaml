"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _parse = _interopRequireDefault(require("./ast/parse"));

var _Document3 = _interopRequireDefault(require("./Document"));

var _schema = _interopRequireDefault(require("./schema"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } _setPrototypeOf(subClass.prototype, superClass && superClass.prototype); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.getPrototypeOf || function _getPrototypeOf(o) { return o.__proto__; }; return _getPrototypeOf(o); }

var defaultOptions = {
  merge: false,
  schema: 'core',
  tags: null
};

function parseDocuments(src, options) {
  var resolvedOptions = options ? Object.assign({}, defaultOptions, options) : defaultOptions;
  var schema = new _schema.default(resolvedOptions);
  return (0, _parse.default)(src).map(function (astDoc) {
    return new _Document3.default(schema).parse(astDoc);
  });
}

function parse(src, options) {
  var docs = parseDocuments(src, options);
  docs.forEach(function (doc) {
    doc.warnings.forEach(function (warning) {
      return console.warn(warning);
    });
    doc.errors.forEach(function (error) {
      throw error;
    });
  });

  if (docs.length > 1) {
    throw new Error('Source contains multiple documents; please use YAML.parseDocuments()');
  }

  return docs[0] && docs[0].toJSON();
}

function stringify(value, options) {
  var resolvedOptions = options ? Object.assign({}, defaultOptions, options) : defaultOptions;
  var doc = new _Document3.default(resolvedOptions);
  doc.contents = value;
  return String(doc);
}

var _default = {
  defaultOptions: defaultOptions,
  Document:
  /*#__PURE__*/
  function (_Document2) {
    function Document(schema) {
      var _this;

      _classCallCheck(this, Document);

      if (schema instanceof _schema.default) {
        _this = _possibleConstructorReturn(this, _getPrototypeOf(Document).call(this, schema));
      } else {
        _this = _possibleConstructorReturn(this, _getPrototypeOf(Document).call(this, Object.assign({}, defaultOptions, schema)));
      }

      return _possibleConstructorReturn(_this);
    }

    _inherits(Document, _Document2);

    return Document;
  }(_Document3.default),
  parse: parse,
  parseDocuments: parseDocuments,
  stringify: stringify
};
exports.default = _default;