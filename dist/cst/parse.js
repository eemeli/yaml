"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parse;

var _Document = _interopRequireDefault(require("./Document"));

var _ParseContext = _interopRequireDefault(require("./ParseContext"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Published as 'yaml/parse-cst'
function parse(src) {
  if (src.indexOf('\r') !== -1) src = src.replace(/\r\n?/g, '\n');
  var context = new _ParseContext.default({
    src: src
  });
  var documents = [];
  var offset = 0;

  while (offset < src.length) {
    var doc = new _Document.default();
    offset = doc.parse(context, offset);
    documents.push(doc);
  }

  documents.toString = function () {
    return documents.join('...\n');
  };

  return documents;
}