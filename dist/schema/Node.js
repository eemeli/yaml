"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.addComment = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var addComment = function addComment(str, indent, comment) {
  return !comment ? str : comment.indexOf('\n') === -1 ? "".concat(str, " #").concat(comment) : "".concat(str, "\n") + comment.replace(/^/gm, "".concat(indent || '', "#"));
};

exports.addComment = addComment;

var Node = function Node() {
  _classCallCheck(this, Node);

  Object.defineProperty(this, "anchor", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: null
  });
  Object.defineProperty(this, "comment", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: null
  });
  Object.defineProperty(this, "commentBefore", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: null
  });
  Object.defineProperty(this, "tag", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: null
  });
};

exports.default = Node;