"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseSeq;

var _Node = require("../ast/Node");

var _errors = require("../errors");

var _Pair = _interopRequireDefault(require("./Pair"));

var _parseUtils = require("./parseUtils");

var _Seq = _interopRequireDefault(require("./Seq"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseSeq(doc, ast) {
  var _ref = ast.type === _Node.Type.FLOW_SEQ ? resolveFlowSeqItems(doc, ast) : resolveBlockSeqItems(doc, ast),
      comments = _ref.comments,
      items = _ref.items;

  var seq = new _Seq.default();
  seq.items = items;
  (0, _parseUtils.resolveComments)(seq, comments);
  ast.resolved = seq;
  return seq;
}

function resolveBlockSeqItems(doc, ast) {
  var comments = [];
  var items = [];

  for (var i = 0; i < ast.items.length; ++i) {
    var item = ast.items[i];

    switch (item.type) {
      case _Node.Type.COMMENT:
        comments.push({
          comment: item.comment,
          before: items.length
        });
        break;

      case _Node.Type.SEQ_ITEM:
        if (item.error) doc.errors.push(item.error);
        items.push(doc.resolveNode(item.node));
        if (item.hasProps) doc.errors.push(new _errors.YAMLSemanticError(item, 'Sequence items cannot have tags or anchors before the - indicator'));
        break;

      default:
        doc.errors.push(new _errors.YAMLSyntaxError(item, "Unexpected ".concat(item.type, " node in sequence")));
    }
  }

  return {
    comments: comments,
    items: items
  };
}

function resolveFlowSeqItems(doc, ast) {
  var comments = [];
  var items = [];
  var explicitKey = false;
  var key = undefined;
  var keyStart = null;
  var next = '[';

  for (var i = 0; i < ast.items.length; ++i) {
    var item = ast.items[i];

    if (typeof item === 'string') {
      if (item !== ':' && (explicitKey || key !== undefined)) {
        if (explicitKey && key === undefined) key = null;
        items.push(new _Pair.default(key));
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
          key = items.pop();
          if (key instanceof _Pair.default) doc.errors.push(new _errors.YAMLSemanticError(item, 'Chaining flow sequence pairs is invalid (e.g. [ a : b : c ])'));
          if (!explicitKey) (0, _parseUtils.checkKeyLength)(doc.errors, ast, i, key, keyStart);
        } else {
          key = null;
        }

        keyStart = null;
        explicitKey = false; // TODO: add error for non-explicit multiline plain key

        next = null;
      } else if (next === '[' || item !== ']' || i < ast.items.length - 1) {
        doc.errors.push(new _errors.YAMLSyntaxError(ast, "Flow sequence contains an unexpected ".concat(item)));
      }
    } else if (item.type === _Node.Type.COMMENT) {
      comments.push({
        comment: item.comment,
        before: items.length
      });
    } else {
      if (next) doc.errors.push(new _errors.YAMLSemanticError(item, "Expected a ".concat(next, " here in flow sequence")));
      var value = doc.resolveNode(item);

      if (key === undefined) {
        items.push(value);
      } else {
        items.push(new _Pair.default(key, value));
        key = undefined;
      }

      keyStart = item.range.start;
      next = ',';
    }
  }

  if (ast.items[ast.items.length - 1] !== ']') doc.errors.push(new _errors.YAMLSemanticError(ast, 'Expected flow sequence to end with ]'));
  if (key !== undefined) items.push(new _Pair.default(key));
  return {
    comments: comments,
    items: items
  };
}