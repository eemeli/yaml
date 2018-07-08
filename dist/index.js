"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _parse = _interopRequireDefault(require("./cst/parse"));

var _createNode = _interopRequireDefault(require("./createNode"));

var _Document = _interopRequireDefault(require("./Document"));

var _errors = require("./errors");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var defaultOptions = {
  keepNodeTypes: true,
  keepBlobsInJSON: true,
  tags: null,
  version: '1.2'
};

var Document =
/*#__PURE__*/
function (_YAMLDocument) {
  _inherits(Document, _YAMLDocument);

  function Document(options) {
    _classCallCheck(this, Document);

    return _possibleConstructorReturn(this, _getPrototypeOf(Document).call(this, Object.assign({}, defaultOptions, options)));
  }

  return Document;
}(_Document.default);

function parseAllDocuments(src, options) {
  return (0, _parse.default)(src).map(function (cstDoc) {
    return new Document(options).parse(cstDoc);
  });
}

function parseDocument(src, options) {
  var cst = (0, _parse.default)(src);
  var doc = new Document(options).parse(cst[0]);

  if (cst.length > 1) {
    var errMsg = 'Source contains multiple documents; please use YAML.parseAllDocuments()';
    doc.errors.unshift(new _errors.YAMLSemanticError(cst[1], errMsg));
  }

  return doc;
}

function parse(src, options) {
  var doc = parseDocument(src, options);
  doc.warnings.forEach(function (warning) {
    return console.warn(warning);
  });
  if (doc.errors.length > 0) throw doc.errors[0];
  return doc.toJSON();
}

function stringify(value, options) {
  var doc = new Document(options);
  doc.contents = value;
  return String(doc);
}

var _default = {
  createNode: _createNode.default,
  defaultOptions: defaultOptions,
  Document: Document,
  parse: parse,
  parseAllDocuments: parseAllDocuments,
  parseDocument: parseDocument,
  stringify: stringify
};
exports.default = _default;