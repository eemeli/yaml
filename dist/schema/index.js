"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = _interopRequireDefault(require("./core"));

var _extended = _interopRequireDefault(require("./extended"));

var _failsafe = _interopRequireDefault(require("./failsafe"));

var _json = _interopRequireDefault(require("./json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  '': _core.default,
  core: _core.default,
  extended: _extended.default,
  failsafe: _failsafe.default,
  json: _json.default
};
exports.default = _default;