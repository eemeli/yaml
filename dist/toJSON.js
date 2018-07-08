"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toJSON;

function toJSON(value, arg, keep) {
  return Array.isArray(value) ? value.map(function (v, i) {
    return toJSON(v, String(i), keep);
  }) : value && typeof value.toJSON === 'function' ? value.toJSON(arg, keep) : value;
}