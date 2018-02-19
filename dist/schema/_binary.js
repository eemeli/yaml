"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.binary = void 0;

var _errors = require("../errors");

var binary = {
  class: Uint8Array,
  // Buffer inherits from Uint8Array
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
      return Buffer.from(node.strValue, 'base64');
    } else if (typeof atob === 'function') {
      var str = atob(node.strValue);
      var buffer = new Uint8Array(str.length);

      for (var i = 0; i < str.length; ++i) {
        buffer[i] = str.charCodeAt(i);
      }

      return buffer;
    } else {
      doc.errors.push(new _errors.YAMLReferenceError(node, 'This environment does not support reading binary tags; either Buffer or atob is required'));
      return null;
    }
  },
  options: {
    lineWidth: 76
  },
  stringify: function stringify(value) {
    var str;

    if (typeof Buffer === 'function') {
      str = value instanceof Buffer ? value.toString('base64') : Buffer.from(value.buffer).toString('base64');
    } else if (typeof btoa === 'function') {
      var s = '';

      for (var i = 0; i < value.length; ++i) {
        s += String.fromCharCode(buf[i]);
      }

      str = btoa(s);
    } else {
      throw new Error('This environment does not support writing binary tags; either Buffer or btoa is required');
    }

    var lineWidth = binary.options.lineWidth;
    var n = Math.ceil(str.length / lineWidth);
    var lines = new Array(n);

    for (var _i = 0, o = 0; _i < n; ++_i, o += lineWidth) {
      lines[_i] = str.substr(o, lineWidth);
    }

    return lines.join('\n');
  }
};
exports.binary = binary;
var _default = [binary];
exports.default = _default;