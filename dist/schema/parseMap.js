"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseMap;

var _Node = require("../cst/Node");

var _errors = require("../errors");

var _Map = _interopRequireDefault(require("./Map"));

var _Pair = _interopRequireDefault(require("./Pair"));

var _parseUtils = require("./parseUtils");

var _Seq = _interopRequireDefault(require("./Seq"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function parseMap(doc, cst) {
  var _ref = cst.type === _Node.Type.FLOW_MAP ? resolveFlowMapItems(doc, cst) : resolveBlockMapItems(doc, cst),
      comments = _ref.comments,
      items = _ref.items;

  var map = new _Map.default();
  map.items = items;
  (0, _parseUtils.resolveComments)(map, comments);

  for (var i = 0; i < items.length; ++i) {
    var iKey = items[i].key;

    for (var j = i + 1; j < items.length; ++j) {
      var jKey = items[j].key;

      if (iKey === jKey || iKey && jKey && iKey.hasOwnProperty('value') && iKey.value === jKey.value) {
        doc.errors.push(new _errors.YAMLSemanticError(cst, "Map keys must be unique; \"".concat(iKey, "\" is repeated")));
        break;
      }
    }

    if (doc.schema.merge && iKey.value === '<<') {
      var src = items[i].value;
      var srcItems = src instanceof _Seq.default ? src.items.reduce(function (acc, _ref2) {
        var items = _ref2.items;
        return acc.concat(items);
      }, []) : src.items;
      var toAdd = srcItems.reduce(function (toAdd, pair) {
        var exists = items.some(function (_ref3) {
          var key = _ref3.key;
          return key.value === pair.key.value;
        }) || toAdd.some(function (_ref4) {
          var key = _ref4.key;
          return key.value === pair.key.value;
        });
        return exists ? toAdd : toAdd.concat(pair);
      }, []);
      Array.prototype.splice.apply(items, [i, 1].concat(_toConsumableArray(toAdd)));
      i += toAdd.length - 1;
    }
  }

  cst.resolved = map;
  return map;
}

function resolveBlockMapItems(doc, cst) {
  var comments = [];
  var items = [];
  var key = undefined;
  var keyStart = null;

  for (var i = 0; i < cst.items.length; ++i) {
    var item = cst.items[i];

    switch (item.type) {
      case _Node.Type.COMMENT:
        comments.push({
          comment: item.comment,
          before: items.length
        });
        break;

      case _Node.Type.MAP_KEY:
        if (key !== undefined) items.push(new _Pair.default(key));
        if (item.error) doc.errors.push(item.error);
        key = doc.resolveNode(item.node);
        keyStart = null;
        break;

      case _Node.Type.MAP_VALUE:
        if (key === undefined) key = null;
        if (item.error) doc.errors.push(item.error);

        if (!item.context.atLineStart && item.node && item.node.type === _Node.Type.MAP && !item.node.context.atLineStart) {
          doc.errors.push(new _errors.YAMLSemanticError(item.node, 'Nested mappings are not allowed in compact mappings'));
        }

        items.push(new _Pair.default(key, doc.resolveNode(item.node)));
        (0, _parseUtils.checkKeyLength)(doc.errors, cst, i, key, keyStart);
        key = undefined;
        keyStart = null;
        break;

      default:
        if (key !== undefined) items.push(new _Pair.default(key));
        key = doc.resolveNode(item);
        keyStart = item.range.start;
        var nextItem = cst.items[i + 1];
        if (!nextItem || nextItem.type !== _Node.Type.MAP_VALUE) doc.errors.push(new _errors.YAMLSemanticError(item, 'Implicit map keys need to be followed by map values'));
        if (item.valueRangeContainsNewline) doc.errors.push(new _errors.YAMLSemanticError(item, 'Implicit map keys need to be on a single line'));
    }
  }

  if (key !== undefined) items.push(new _Pair.default(key));
  return {
    comments: comments,
    items: items
  };
}

function resolveFlowMapItems(doc, cst) {
  var comments = [];
  var items = [];
  var key = undefined;
  var keyStart = null;
  var explicitKey = false;
  var next = '{';

  for (var i = 0; i < cst.items.length; ++i) {
    (0, _parseUtils.checkKeyLength)(doc.errors, cst, i, key, keyStart);
    var item = cst.items[i];

    if (typeof item === 'string') {
      if (item === '?' && key === undefined && !explicitKey) {
        explicitKey = true;
        next = ':';
        continue;
      }

      if (item === ':') {
        if (key === undefined) key = null;

        if (next === ':') {
          next = ',';
          continue;
        }
      } else {
        if (explicitKey) {
          if (key === undefined && item !== ',') key = null;
          explicitKey = false;
        }

        if (key !== undefined) {
          items.push(new _Pair.default(key));
          key = undefined;
          keyStart = null;

          if (item === ',') {
            next = ':';
            continue;
          }
        }
      }

      if (item === '}') {
        if (i === cst.items.length - 1) continue;
      } else if (item === next) {
        next = ':';
        continue;
      }

      doc.errors.push(new _errors.YAMLSyntaxError(cst, "Flow map contains an unexpected ".concat(item)));
    } else if (item.type === _Node.Type.COMMENT) {
      comments.push({
        comment: item.comment,
        before: items.length
      });
    } else if (key === undefined) {
      if (next === ',') doc.errors.push(new _errors.YAMLSemanticError(item, 'Separator , missing in flow map'));
      key = doc.resolveNode(item);
      keyStart = explicitKey ? null : item.range.start; // TODO: add error for non-explicit multiline plain key
    } else {
      if (next !== ',') doc.errors.push(new _errors.YAMLSemanticError(item, 'Indicator : missing in flow map entry'));
      items.push(new _Pair.default(key, doc.resolveNode(item)));
      key = undefined;
      explicitKey = false;
    }
  }

  if (cst.items[cst.items.length - 1] !== '}') doc.errors.push(new _errors.YAMLSemanticError(cst, 'Expected flow map to end with }'));
  if (key !== undefined) items.push(new _Pair.default(key));
  return {
    comments: comments,
    items: items
  };
}