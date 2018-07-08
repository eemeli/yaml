"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stringify = stringify;
exports.str = exports.resolve = exports.strOptions = void 0;

var _addComment = require("../addComment");

var _Node = require("../cst/Node");

var _foldFlowLines = _interopRequireWildcard(require("../foldFlowLines"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var strOptions = {
  defaultType: _Node.Type.PLAIN,
  dropCR: false,
  doubleQuoted: {
    jsonEncoding: false,
    minMultiLineLength: 40
  },
  fold: {
    lineWidth: 80,
    minContentWidth: 20
  }
};
exports.strOptions = strOptions;

var resolve = function resolve(doc, node) {
  // on error, will return { str: string, errors: Error[] }
  var res = node.strValue;
  if (!res) return '';
  if (typeof res === 'string') return res;
  res.errors.forEach(function (error) {
    if (!error.source) error.source = node;
    doc.errors.push(error);
  });
  return res.str;
};

exports.resolve = resolve;

function doubleQuotedString(value, indent, oneLine) {
  var _strOptions$doubleQuo = strOptions.doubleQuoted,
      jsonEncoding = _strOptions$doubleQuo.jsonEncoding,
      minMultiLineLength = _strOptions$doubleQuo.minMultiLineLength;
  var json = JSON.stringify(value);
  if (jsonEncoding) return json;
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
        start = i + 1;
        break;

      case 'n':
        if (oneLine || json[i + 2] === '"' || json.length < minMultiLineLength) {
          i += 1;
        } else {
          // folding will eat first newline
          str += json.slice(start, i) + '\n\n';

          while (json[i + 2] === '\\' && json[i + 3] === 'n' && json[i + 4] !== '"') {
            str += '\n';
            i += 2;
          }

          str += indent; // space after newline needs to be escaped to not be folded

          if (json[i + 2] === ' ') str += '\\';
          i += 1;
          start = i + 1;
        }

        break;

      default:
        i += 1;
    }
  }

  str = start ? str + json.slice(start) : json;
  return oneLine ? str : (0, _foldFlowLines.default)(str, indent, _foldFlowLines.FOLD_QUOTED, strOptions.fold);
}

function singleQuotedString(value, indent, oneLine) {
  if (oneLine) {
    if (/\n/.test(value)) return doubleQuotedString(value, indent, true);
  } else {
    // single quoted string can't have leading or trailing whitespace around newline
    if (/[ \t]\n|\n[ \t]/.test(value)) return doubleQuotedString(value, indent, false);
  }

  value = "'" + value.replace(/'/g, "''").replace(/\n+/g, "$&\n".concat(indent)) + "'";
  return oneLine ? value : (0, _foldFlowLines.default)(value, indent, _foldFlowLines.FOLD_FLOW, strOptions.fold);
}

function blockString(value, indent, literal, forceBlockIndent, comment, onComment) {
  // Block can't end in whitespace unless the last line is non-empty
  // Strings consisting of only whitespace are best rendered explicitly
  if (/\n[\t ]+$/.test(value) || /^\s*$/.test(value)) {
    return doubleQuotedString(value, indent, false);
  }

  if (forceBlockIndent && !indent) indent = ' ';
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

  if (comment) {
    header += ' #' + comment.replace(/ ?[\r\n]+/g, ' ');
    if (onComment) onComment();
  }

  if (!value) return "".concat(header).concat(indentSize, "\n").concat(indent).concat(wsEnd);

  if (literal) {
    value = value.replace(/\n+/g, "$&".concat(indent));
    return "".concat(header, "\n").concat(indent).concat(wsStart).concat(value).concat(wsEnd);
  }

  value = value.replace(/\n+/g, '\n$&').replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, '$1$2') // more-indented lines aren't folded
  //         ^ ind.line  ^ empty     ^ capture next empty lines only at end of indent
  .replace(/\n+/g, "$&".concat(indent));
  var body = (0, _foldFlowLines.default)("".concat(wsStart).concat(value).concat(wsEnd), indent, _foldFlowLines.FOLD_BLOCK, strOptions.fold);
  return "".concat(header, "\n").concat(indent).concat(body);
}

function plainString(value, indent, implicitKey, inFlow, forceBlockIndent, tags, comment, onComment) {
  if (implicitKey && /[\n[\]{},]/.test(value) || inFlow && /[[\]{},]/.test(value)) {
    return doubleQuotedString(value, indent, implicitKey);
  }

  if (!value || /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t ]$/.test(value)) {
    // not allowed:
    // - empty string
    // - start with an indicator character (except [?:-]) or /[?-] /
    // - '\n ', ': ' or ' \n' anywhere
    // - '#' not preceded by a non-space char
    // - end with ' '
    return implicitKey || inFlow ? doubleQuotedString(value, indent, implicitKey) : blockString(value, indent, false, forceBlockIndent, comment, onComment);
  } // Need to verify that output will be parsed as a string


  var str = value.replace(/\n+/g, "$&\n".concat(indent));

  if (typeof tags.resolveScalar(str).value !== 'string') {
    return doubleQuotedString(value, indent, implicitKey);
  }

  var body = implicitKey ? str : (0, _foldFlowLines.default)(str, indent, _foldFlowLines.FOLD_FLOW, strOptions.fold);

  if (comment && !inFlow && (body.indexOf('\n') !== -1 || comment.indexOf('\n') !== -1)) {
    if (onComment) onComment();
    return (0, _addComment.addCommentBefore)(body, indent, comment);
  }

  return body;
}

function stringify(_ref) {
  var comment = _ref.comment,
      type = _ref.type,
      value = _ref.value;

  var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      forceBlockIndent = _ref2.forceBlockIndent,
      implicitKey = _ref2.implicitKey,
      indent = _ref2.indent,
      inFlow = _ref2.inFlow,
      tags = _ref2.tags;

  var onComment = arguments.length > 2 ? arguments[2] : undefined;
  var dropCR = strOptions.dropCR,
      defaultType = strOptions.defaultType;
  if (typeof value !== 'string') value = String(value);
  if (dropCR && /\r/.test(value)) value = value.replace(/\r\n?/g, '\n');

  var _stringify = function _stringify(_type) {
    switch (_type) {
      case _Node.Type.BLOCK_FOLDED:
        return blockString(value, indent, false, forceBlockIndent, comment, onComment);

      case _Node.Type.BLOCK_LITERAL:
        return blockString(value, indent, true, forceBlockIndent, comment, onComment);

      case _Node.Type.QUOTE_DOUBLE:
        return doubleQuotedString(value, indent, implicitKey, comment);

      case _Node.Type.QUOTE_SINGLE:
        return singleQuotedString(value, indent, implicitKey, comment);

      case _Node.Type.PLAIN:
        return plainString(value, indent, implicitKey, inFlow, forceBlockIndent, tags, comment, onComment);

      default:
        return null;
    }
  };

  if (type !== _Node.Type.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f]/.test(value)) {
    // force double quotes on control characters
    type = _Node.Type.QUOTE_DOUBLE;
  } else if ((implicitKey || inFlow) && (type === _Node.Type.BLOCK_FOLDED || type === _Node.Type.BLOCK_LITERAL)) {
    // should not happen; blocks are not valid inside flow containers
    type = _Node.Type.QUOTE_DOUBLE;
  }

  var res = _stringify(type);

  if (res === null) {
    res = _stringify(defaultType);
    if (res === null) throw new Error("Unsupported default string type ".concat(defaultType));
  }

  return res;
}

var str = {
  class: String,
  default: true,
  tag: 'tag:yaml.org,2002:str',
  resolve: resolve,
  stringify: stringify,
  options: strOptions
};
exports.str = str;