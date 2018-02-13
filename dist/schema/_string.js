"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.str = void 0;

var _rawYaml = require("raw-yaml");

function doubleQuotedString(value, indent, oneLine) {
  var json = JSON.stringify(value);
  var str = '';
  var start = 0;

  for (var i = 0, ch = json[i]; ch; ch = json[++i]) {
    if (ch === ' ' && json[i + 1] === '\\' && json[i + 2] === 'n') {
      // space before newline needs to be escaped to not be folded
      str += json.slice(start, i) + '\\ ';
      i += 1;
      start = i;
      ch = '\\';
    }

    if (ch === '\\') switch (json[i + 1]) {
      case 'u':
        str += json.slice(start, i);
        var code = json.substr(i + 2, 4);

        switch (code) {
          case '0000':
            str += '\\0';
            break;

          case '0007':
            str += '\\a';
            break;

          case '000b':
            str += '\\v';
            break;

          case '001b':
            str += '\\e';
            break;

          case '0085':
            str += '\\N';
            break;

          case '00a0':
            str += '\\_';
            break;

          case '2028':
            str += '\\L';
            break;

          case '2029':
            str += '\\P';
            break;

          default:
            if (code.substr(0, 2) === '00') str += '\\x' + code.substr(2);else str += json.substr(i, 6);
        }

        i += 5;
        start = i;
        break;

      case 'n':
        if (oneLine) {
          i += 1;
        } else {
          // folding will eat first newline
          str += json.slice(start, i - 1) + '\n\n';

          while (json[i + 2] === '\\' && json[i + 3] === 'n') {
            str += '\n';
            i += 2;
          }

          str += indent; // space after newline needs to be escaped to not be folded

          if (json[i + 2] === ' ') str += '\\';
          i += 1;
          start = i;
        }

        break;

      default:
        i += 1;
    }
  }

  return start ? str + json.slice(start) : json;
}

function singleQuotedString(value, indent, oneLine) {
  if (oneLine) {
    if (/\n/.test(value)) return doubleQuotedString(value, indent, true);
  } else {
    // single quoted string can't have leading or trailing whitespace around newline
    if (/[ \t]\n|\n[ \t]/.test(value)) return doubleQuotedString(value, indent, false);
  }

  value = value.replace(/'/g, "''").replace(/\n+/g, "$&\n".concat(indent));
  return "'".concat(value, "'");
}

function blockString(value, indent, literal) {
  // block can't end in whitespace unless the last line is non-empty
  if (/\n[\t ]+$/.test(value)) return doubleQuotedString(value, indent, false);
  var indentSize = indent ? '2' : '1'; // root is at -1

  var header = literal ? '|' : '>';
  if (!value) return header + '\n';
  var wsStart = '';
  var wsEnd = '';
  value = value.replace(/[\n\t ]*$/, function (ws) {
    var n = ws.indexOf('\n');

    if (n === -1) {
      header += '-'; // strip
    } else if (value === ws || n !== ws.length - 1) {
      header += '+'; // keep
    }

    wsEnd = ws.replace(/\n$/, '');
    return '';
  }).replace(/^[\n ]*/, function (ws) {
    if (ws.indexOf(' ') !== -1) header += indentSize;
    var m = ws.match(/ +$/);

    if (m) {
      wsStart = ws.slice(0, -m[0].length);
      return m[0];
    } else {
      wsStart = ws;
      return '';
    }
  });
  if (wsEnd) wsEnd = wsEnd.replace(/\n+(?!\n|$)/g, "$&".concat(indent));
  if (wsStart) wsStart = wsStart.replace(/\n+/g, "$&".concat(indent));
  if (!value) return "".concat(header).concat(indentSize, "\n").concat(indent).concat(wsEnd);

  if (literal) {
    value = value.replace(/\n+/g, "$&".concat(indent));
  } else {
    value = value.replace(/\n+/g, '\n$&').replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, '$1$2') // more-indented lines aren't folded
    //         ^ ind.line  ^ empty     ^ capture next empty lines only at end of indent
    .replace(/\n+/g, "$&".concat(indent));
  }

  return "".concat(header, "\n").concat(indent).concat(wsStart).concat(value).concat(wsEnd);
}

function plainString(value, indent, implicitKey, inFlow) {
  if (implicitKey && /[\n[\]{},]/.test(value) || inFlow && /[[\]{},]/.test(value)) {
    return doubleQuotedString(value, indent, implicitKey);
  }

  if (!value || /^[\n\t #]|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t ]$/.test(value)) {
    // not allowed:
    // - empty string
    // - start with ' ', '? ' or '- '
    // - '\n ', ': ' or ' \n' anywhere
    // - '#' not preceded by a non-space char
    // - end with ' '
    return inFlow ? doubleQuotedString(value, indent, implicitKey) : blockString(value, indent, false);
  }

  return value.replace(/\n+/g, "$&\n".concat(indent));
}

var str = {
  class: String,
  tag: 'tag:yaml.org,2002:str',
  resolve: function resolve(doc, node) {
    return node.strValue || '';
  },
  options: {
    defaultType: _rawYaml.Type.PLAIN,
    dropCR: true
  },
  stringify: function stringify(value) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        implicitKey = _ref.implicitKey,
        indent = _ref.indent,
        inFlow = _ref.inFlow,
        type = _ref.type;

    if (typeof value !== 'string') value = String(value);
    if (str.options.dropCR && /\r/.test(value)) value = value.replace(/\r\n?/g, '\n');

    var _stringify = function _stringify(_type) {
      switch (_type) {
        case _rawYaml.Type.BLOCK_FOLDED:
          return blockString(value, indent, false);

        case _rawYaml.Type.BLOCK_LITERAL:
          return blockString(value, indent, true);

        case _rawYaml.Type.QUOTE_DOUBLE:
          return doubleQuotedString(value, indent, implicitKey);

        case _rawYaml.Type.QUOTE_SINGLE:
          return singleQuotedString(value, indent, implicitKey);

        case _rawYaml.Type.PLAIN:
          return plainString(value, indent, implicitKey, inFlow);

        default:
          return null;
      }
    };

    if (type !== _rawYaml.Type.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f]/.test(value)) {
      // force double quotes on control characters
      type = _rawYaml.Type.QUOTE_DOUBLE;
    } else if (inFlow && (type === _rawYaml.Type.BLOCK_FOLDED || type === _rawYaml.Type.BLOCK_LITERAL)) {
      // should not happen; blocks are not valid inside flow containers
      type = _rawYaml.Type.QUOTE_DOUBLE;
    }

    var res = _stringify(type);

    if (res === null) {
      res = _stringify(str.options.defaultType);
      if (res === null) throw new Error("Unsupported default string type ".concat(str.options.defaultType));
    }

    return res;
  }
};
exports.str = str;
var _default = [str];
exports.default = _default;