"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Comment = exports.Pair = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Pair =
/*#__PURE__*/
function () {
  function Pair(key) {
    var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, Pair);

    this.key = key;
    this.value = value;
  }

  _createClass(Pair, [{
    key: "asPlainObject",
    get: function get() {
      var pair = {};
      pair[this.stringKey] = this.plainValue;
      return pair;
    }
  }, {
    key: "plainKey",
    get: function get() {
      var key = this.key;
      return key && 'asPlainObject' in key ? key.asPlainObject : key;
    }
  }, {
    key: "plainValue",
    get: function get() {
      var value = this.value;
      return value && 'asPlainObject' in value ? value.asPlainObject : value;
    }
  }, {
    key: "stringKey",
    get: function get() {
      var key = this.plainKey;
      if (_typeof(key) === 'object') try {
        return JSON.stringify(key);
      } catch (e) {
        /* should not happen, but let's ignore in any case */
      }
      return String(key);
    }
  }]);

  return Pair;
}();

exports.Pair = Pair;

var Comment = function Comment(comment, before) {
  _classCallCheck(this, Comment);

  this.before = before;
  this.comment = comment;
};

exports.Comment = Comment;

var Collection =
/*#__PURE__*/
function () {
  function Collection() {
    _classCallCheck(this, Collection);

    this.comments = []; // TODO: include collection & item comments

    this.items = [];
  }

  _createClass(Collection, [{
    key: "addComment",
    value: function addComment(comment) {
      this.comments.push(new Comment(comment, this.items.length));
    } // overridden in implementations

  }, {
    key: "asPlainObject",
    get: function get() {
      return null;
    }
  }]);

  return Collection;
}();

exports.default = Collection;