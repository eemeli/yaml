"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = foldFlowLines;
exports.FOLD_QUOTED = exports.FOLD_BLOCK = exports.FOLD_FLOW = void 0;
var FOLD_FLOW = 'flow';
exports.FOLD_FLOW = FOLD_FLOW;
var FOLD_BLOCK = 'block';
exports.FOLD_BLOCK = FOLD_BLOCK;
var FOLD_QUOTED = 'quoted';
/**
 * Tries to keep input at up to `lineWidth` characters, splitting only on spaces
 * not followed by newlines or spaces unless `mode` is `'quoted'`. Lines are
 * terminated with `\n` and started with `indent`.
 *
 * @param {string} text
 * @param {string} indent
 * @param {string} [mode='flow'] `'block'` prevents more-indented lines
 *   from being folded; `'quoted'` allows for `\` escapes, including escaped
 *   newlines
 * @param {Object} options
 * @param {number} [options.indentAtStart] Accounts for leading contents on
 *   the first line, defaulting to `indent.length`
 * @param {number} [options.lineWidth=80]
 * @param {number} [options.minContentWidth=20] Allow highly indented lines to
 *   stretch the line width
 * @param {function} options.onFold Called once if the text is folded
 * @param {function} options.onFold Called once if any line of text exceeds
 *   lineWidth characters
 */

exports.FOLD_QUOTED = FOLD_QUOTED;

function foldFlowLines(text, indent, mode, _ref) {
  var indentAtStart = _ref.indentAtStart,
      _ref$lineWidth = _ref.lineWidth,
      lineWidth = _ref$lineWidth === void 0 ? 80 : _ref$lineWidth,
      _ref$minContentWidth = _ref.minContentWidth,
      minContentWidth = _ref$minContentWidth === void 0 ? 20 : _ref$minContentWidth,
      onFold = _ref.onFold,
      onOverflow = _ref.onOverflow;
  if (!lineWidth || lineWidth < 0) return text;
  var endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
  if (text.length <= endStep) return text;
  var folds = [];
  var escapedFolds = {};
  var end = lineWidth - (typeof indentAtStart === 'number' ? indentAtStart : indent.length);
  var split = undefined;
  var prev = undefined;
  var overflow = false;

  for (var i = 0, ch = text[0]; ch; ch = text[i += 1]) {
    if (mode === FOLD_QUOTED && ch === '\\') {
      switch (text[i + 1]) {
        case 'x':
          ch = text[i += 4];
          break;

        case 'u':
          ch = text[i += 6];
          break;

        case 'U':
          ch = text[i += 10];
          break;

        default:
          ch = text[i += 2];
      }
    }

    if (ch === '\n') {
      if (mode === FOLD_BLOCK) {
        // more-indented lines in blocks can't be folded
        var next = text[i + 1];

        while (next === ' ' || next === '\t') {
          do {
            ch = text[i += 1];
          } while (ch && ch !== '\n');

          next = text[i + 1];
        }
      }

      end = i + endStep;
      split = undefined;
    } else {
      if (ch === ' ' && prev && prev !== ' ' && prev !== '\n' && prev !== '\t') {
        // space surrounded by non-space can be replaced with newline + indent
        var _next = text[i + 1];
        if (_next && _next !== ' ' && _next !== '\n' && _next !== '\t') split = i;
      }

      if (i >= end) {
        if (split) {
          folds.push(split);
          end = split + endStep;
          split = undefined;
        } else if (mode === FOLD_QUOTED) {
          // white-space collected at end may stretch past lineWidth
          while (prev === ' ' || prev === '\t') {
            prev = ch;
            ch = text[i += 1];
            overflow = true;
          } // i - 2 accounts for not-dropped last char + newline-escaping \


          folds.push(i - 2);
          escapedFolds[i - 2] = true;
          end = i - 2 + endStep;
          split = undefined;
        } else {
          overflow = true;
        }
      }
    }

    prev = ch;
  }

  if (overflow && onOverflow) onOverflow();
  if (folds.length === 0) return text;
  if (onFold) onFold();
  var res = text.slice(0, folds[0]);

  for (var _i = 0; _i < folds.length; ++_i) {
    var fold = folds[_i];

    var _end = folds[_i + 1] || text.length;

    if (mode === FOLD_QUOTED && escapedFolds[fold]) res += "".concat(text[fold], "\\");
    res += "\n".concat(indent).concat(text.slice(fold + 1, _end));
  }

  return res;
}