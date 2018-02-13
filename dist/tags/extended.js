"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _errors = require("../errors");

var _Map = _interopRequireDefault(require("./Map"));

var _Seq = _interopRequireDefault(require("./Seq"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var parseSexagesimal = function parseSexagesimal(sign, parts) {
  var n = parts.split(':').reduce(function (n, p) {
    return n * 60 + Number(p);
  }, 0);
  return sign === '-' ? -n : n;
};

var _default = [{
  tag: 'tag:yaml.org,2002:map',
  resolve: function resolve(doc, node) {
    return new _Map.default(doc, node);
  }
}, {
  tag: 'tag:yaml.org,2002:seq',
  resolve: function resolve(doc, node) {
    return new _Seq.default(doc, node);
  }
}, {
  tag: 'tag:yaml.org,2002:str',
  resolve: function resolve(doc, node) {
    return node.strValue || '';
  }
}, {
  tag: 'tag:yaml.org,2002:null',
  test: /^(?:~|null)?$/i,
  resolve: function resolve() {
    return null;
  }
}, {
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:y|yes|true|on)$/i,
  resolve: function resolve() {
    return true;
  }
}, {
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:n|no|false|off)$/i,
  resolve: function resolve() {
    return false;
  }
}, {
  tag: 'tag:yaml.org,2002:int',
  test: /^0b([0-1_]+)$/,
  resolve: function resolve(str, bin) {
    return parseInt(bin.replace(/_/g, ''), 2);
  }
}, {
  tag: 'tag:yaml.org,2002:int',
  test: /^0o([0-7_]+)$/,
  resolve: function resolve(str, oct) {
    return parseInt(oct.replace(/_/g, ''), 8);
  }
}, {
  tag: 'tag:yaml.org,2002:int',
  test: /^[-+]?[0-9][0-9_]*$/,
  resolve: function resolve(str) {
    return parseInt(str.replace(/_/g, ''), 10);
  }
}, {
  tag: 'tag:yaml.org,2002:int',
  test: /^0x([0-9a-fA-F_]+)$/,
  resolve: function resolve(str, hex) {
    return parseInt(hex.replace(/_/g, ''), 16);
  }
}, {
  tag: 'tag:yaml.org,2002:int',
  test: /^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+)$/,
  resolve: function resolve(str, sign, parts) {
    return parseSexagesimal(sign, parts.replace(/_/g, ''));
  }
}, {
  tag: 'tag:yaml.org,2002:float',
  test: /^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*)$/,
  resolve: function resolve(str, sign, parts) {
    return parseSexagesimal(sign, parts.replace(/_/g, ''));
  }
}, {
  tag: 'tag:yaml.org,2002:float',
  test: /^(?:[-+]?\.inf|(\.nan))$/i,
  resolve: function resolve(str, nan) {
    return nan ? NaN : str[0] === '-' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }
}, {
  tag: 'tag:yaml.org,2002:float',
  test: /^[-+]?([0-9][0-9_]*)?\.[0-9_]*([eE][-+]?[0-9]+)?$/,
  resolve: function resolve(str) {
    return parseFloat(str.replace(/_/g, ''));
  }
}, {
  tag: 'tag:yaml.org,2002:timestamp',
  // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
  // may be omitted altogether, resulting in a date format. In such a case, the time part is
  // assumed to be 00:00:00Z (start of day, UTC).
  test: RegExp('^(?:' + '([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})' + // YYYY-Mm-Dd
  '(?:(?:t|T|[ \\t]+)' + // t | T | whitespace
  '([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)' + // Hh:Mm:Ss(.ss)?
  '(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?' + // Z | +5 | -03:30
  ')?' + ')$'),
  resolve: function resolve(str, year, month, day, hour, minute, second, millisec, tz) {
    if (millisec) millisec = (millisec + '00').substr(1, 3);
    var date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec || 0);

    if (tz && tz !== 'Z') {
      var d = parseSexagesimal(tz[0], tz.slice(1));
      if (Math.abs(d) < 30) d *= 60;
      date -= 60000 * d;
    }

    return new Date(date);
  }
}, {
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
      doc.errors.push(new _errors.YAMLReferenceError(node, 'This environment does not support binary tags; either Buffer or atob is required'));
      return null;
    }
  } // function bufferToBase64(buf) {
  //   let str = ''
  //   for (let i = 0; i < buf.length; ++i) str += String.fromCharCode(buf[i])
  //   return btoa(str)
  // }

}];
exports.default = _default;