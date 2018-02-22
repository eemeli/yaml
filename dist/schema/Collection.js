"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Comment = exports.toJSON = void 0;

var _errors = require("../errors");

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var toJSON = function toJSON(value) {
  return Array.isArray(value) ? value.map(toJSON) : value && _typeof(value) === 'object' && 'toJSON' in value ? value.toJSON() : value;
};

exports.toJSON = toJSON;

var Comment = function Comment(comment, before) {
  _classCallCheck(this, Comment);

  this.before = before;
  this.comment = comment;
};

exports.Comment = Comment;

var Collection =
/*#__PURE__*/
function () {
  _createClass(Collection, null, [{
    key: "checkKeyLength",
    value: function checkKeyLength(doc, node, itemIdx, key, keyStart) {
      if (typeof keyStart !== 'number') return;
      var item = node.items[itemIdx];
      var keyEnd = item && item.range && item.range.start;

      if (!keyEnd) {
        for (var i = itemIdx - 1; i >= 0; --i) {
          var it = node.items[i];

          if (it && it.range) {
            keyEnd = it.range.end + 2 * (itemIdx - i);
            break;
          }
        }
      }

      if (keyEnd > keyStart + 1024) {
        var k = String(key).substr(0, 8) + '...' + String(key).substr(-8);
        doc.errors.push(new _errors.YAMLSyntaxError(node, "The \"".concat(k, "\" key is too long")));
      }
    }
  }]);

  function Collection(doc) {
    _classCallCheck(this, Collection);

    this.comments = []; // TODO: include collection & item comments

    this.doc = doc;
    this.items = [];
  }

  _createClass(Collection, [{
    key: "addComment",
    value: function addComment(comment) {
      this.comments.push(new Comment(comment, this.items.length));
    } // overridden in implementations

  }, {
    key: "toJSON",
    value: function toJSON() {
      return null;
    }
  }]);

  return Collection;
}();

exports.default = Collection;