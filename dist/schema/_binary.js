"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.binary = void 0;

var _errors = require("../errors");

var _Node = require("../cst/Node");

var _string = require("./_string");

// Published as 'yaml/types/binary'
var binary = {
  class: Uint8Array,
  // Buffer inherits from Uint8Array
  default: false,
  tag: 'tag:yaml.org,2002:binary',

  /**
   * Returns a Buffer in node and an Uint8Array in browsers
   *
   * To use the resulting buffer as an image, you'll want to do something like:
   *
   *   const blob = new Blob([buffer], { type: 'image/jpeg' })
   *   document.querySelector('#photo').src = URL.createObjectURL(blob)
   */
  resolve: function resolve(doc, node) {
    if (typeof Buffer === 'function') {
      var src = (0, _string.resolve)(doc, node);
      return Buffer.from(src, 'base64');
    } else if (typeof atob === 'function') {
      var _src = atob((0, _string.resolve)(doc, node));

      var buffer = new Uint8Array(_src.length);

      for (var i = 0; i < _src.length; ++i) {
        buffer[i] = _src.charCodeAt(i);
      }

      return buffer;
    } else {
      doc.errors.push(new _errors.YAMLReferenceError(node, 'This environment does not support reading binary tags; either Buffer or atob is required'));
      return null;
    }
  },
  options: {
    defaultType: _Node.Type.BLOCK_LITERAL,
    lineWidth: 76
  },
  stringify: function stringify(_ref, ctx, onComment) {
    var comment = _ref.comment,
        type = _ref.type,
        value = _ref.value;
    var src;

    if (typeof Buffer === 'function') {
      src = value instanceof Buffer ? value.toString('base64') : Buffer.from(value.buffer).toString('base64');
    } else if (typeof btoa === 'function') {
      var s = '';

      for (var i = 0; i < value.length; ++i) {
        s += String.fromCharCode(buf[i]);
      }

      src = btoa(s);
    } else {
      throw new Error('This environment does not support writing binary tags; either Buffer or btoa is required');
    }

    if (!type) type = binary.options.defaultType;

    if (type === _Node.Type.QUOTE_DOUBLE) {
      value = src;
    } else {
      var lineWidth = binary.options.lineWidth;
      var n = Math.ceil(src.length / lineWidth);
      var lines = new Array(n);

      for (var _i = 0, o = 0; _i < n; ++_i, o += lineWidth) {
        lines[_i] = src.substr(o, lineWidth);
      }

      value = lines.join(type === _Node.Type.BLOCK_LITERAL ? '\n' : ' ');
    }

    return (0, _string.stringify)({
      comment: comment,
      type: type,
      value: value
    }, ctx, onComment);
  }
};
exports.binary = binary;
var _default = [binary];
exports.default = _default;