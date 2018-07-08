"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Range =
/*#__PURE__*/
function () {
  _createClass(Range, null, [{
    key: "copy",
    value: function copy(orig) {
      return new Range(orig.start, orig.end);
    }
  }]);

  function Range(start, end) {
    _classCallCheck(this, Range);

    this.start = start;
    this.end = end || start;
  }

  _createClass(Range, [{
    key: "apply",
    value: function apply(src) {
      return this.isEmpty ? '' : src.slice(this.start, this.end);
    }
  }, {
    key: "isEmpty",
    get: function get() {
      return typeof this.start !== 'number' || !this.end || this.end <= this.start;
    }
  }, {
    key: "length",
    get: function get() {
      return this.isEmpty ? 0 : this.end - this.start;
    }
  }]);

  return Range;
}();

exports.default = Range;