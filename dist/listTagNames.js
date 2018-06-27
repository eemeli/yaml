"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Collection = _interopRequireDefault(require("./schema/Collection"));

var _Pair = _interopRequireDefault(require("./schema/Pair"));

var _Scalar = _interopRequireDefault(require("./schema/Scalar"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var visit = function visit(node, tags) {
  if (node && _typeof(node) === 'object') {
    var tag = node.tag;

    if (node instanceof _Collection.default) {
      if (tag) tags[tag] = true;
      node.items.forEach(function (n) {
        return visit(n, tags);
      });
    } else if (node instanceof _Pair.default) {
      visit(node.key, tags);
      visit(node.value, tags);
    } else if (node instanceof _Scalar.default) {
      if (tag) tags[tag] = true;
    }
  }

  return tags;
};

var _default = function _default(node) {
  return Object.keys(visit(node, {}));
};

exports.default = _default;