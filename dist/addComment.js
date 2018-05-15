"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addComment;

function addComment(str, indent, comment) {
  return !comment ? str : comment.indexOf('\n') === -1 ? "".concat(str, " #").concat(comment) : "".concat(str, "\n") + comment.replace(/^/gm, "".concat(indent || '', "#"));
}