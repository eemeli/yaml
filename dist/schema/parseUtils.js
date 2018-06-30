"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkKeyLength = checkKeyLength;
exports.resolveComments = resolveComments;

var _errors = require("../errors");

function checkKeyLength(errors, node, itemIdx, key, keyStart) {
  if (typeof keyStart !== 'number') return;
  var item = node.items[itemIdx];
  var keyEnd = item && item.range && item.range.start;

  if (!keyEnd) {
    for (var i = itemIdx - 1; i >= 0; --i) {
      var it = node.items[i];

      if (it && it.range) {
        keyEnd = it.range.end + 2 * (itemIdx - i);
        break;
      }
    }
  }

  if (keyEnd > keyStart + 1024) {
    var k = String(key).substr(0, 8) + '...' + String(key).substr(-8);
    errors.push(new _errors.YAMLSemanticError(node, "The \"".concat(k, "\" key is too long")));
  }
}

function resolveComments(collection, comments) {
  comments.forEach(function (_ref) {
    var comment = _ref.comment,
        before = _ref.before;
    var item = collection.items[before];

    if (!item) {
      if (collection.comment) collection.comment += '\n' + comment;else collection.comment = comment;
    } else {
      if (item.commentBefore) item.commentBefore += '\n' + comment;else item.commentBefore = comment;
    }
  });
}