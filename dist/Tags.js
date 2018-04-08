"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DefaultTags = exports.DefaultTagPrefixes = void 0;

var _Node = require("./ast/Node");

var _errors = require("./errors");

var _schema = _interopRequireDefault(require("./schema"));

var _Collection = _interopRequireDefault(require("./schema/Collection"));

var _Pair = _interopRequireDefault(require("./schema/Pair"));

var _Scalar = _interopRequireDefault(require("./schema/Scalar"));

var _string = require("./schema/_string");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var DefaultTagPrefixes = {
  '!': '!',
  '!!': 'tag:yaml.org,2002:'
};
exports.DefaultTagPrefixes = DefaultTagPrefixes;
var DefaultTags = {
  MAP: 'tag:yaml.org,2002:map',
  SEQ: 'tag:yaml.org,2002:seq',
  STR: 'tag:yaml.org,2002:str'
};
exports.DefaultTags = DefaultTags;

var isMap = function isMap(_ref) {
  var type = _ref.type;
  return type === _Node.Type.FLOW_MAP || type === _Node.Type.MAP;
};

var isSeq = function isSeq(_ref2) {
  var type = _ref2.type;
  return type === _Node.Type.FLOW_SEQ || type === _Node.Type.SEQ;
};

var Tags =
/*#__PURE__*/
function () {
  _createClass(Tags, null, [{
    key: "defaultStringifier",
    value: function defaultStringifier(value) {
      return JSON.stringify(value);
    }
  }]);

  function Tags(_ref3) {
    var schema = _ref3.schema,
        tags = _ref3.tags;

    _classCallCheck(this, Tags);

    this.schema = Array.isArray(schema) ? schema : _schema.default[schema || ''];

    if (!this.schema) {
      var keys = Object.keys(_schema.default).filter(function (key) {
        return key;
      }).map(function (key) {
        return JSON.stringify(key);
      }).join(', ');
      throw new Error("Unknown schema; use ".concat(keys, ", or { tag, test, resolve }[]"));
    }

    if (Array.isArray(tags)) {
      this.schema = this.schema.concat(tags);
    } else if (typeof tags === 'function') {
      this.schema = tags(this.schema.slice());
    }
  } // falls back to string on no match


  _createClass(Tags, [{
    key: "resolveScalar",
    value: function resolveScalar(str, tags) {
      if (!tags) tags = this.schema;

      for (var i = 0; i < tags.length; ++i) {
        var _tags$i = tags[i],
            test = _tags$i.test,
            resolve = _tags$i.resolve;

        if (test) {
          var match = str.match(test);
          if (match) return new _Scalar.default(resolve.apply(null, match));
        }
      }

      if (this.schema.scalarFallback) str = this.schema.scalarFallback(str);
      return new _Scalar.default(str);
    } // sets node.resolved on success

  }, {
    key: "resolveNode",
    value: function resolveNode(doc, node, tagName) {
      var tags = this.schema.filter(function (_ref4) {
        var tag = _ref4.tag;
        return tag === tagName;
      });
      var generic = tags.find(function (_ref5) {
        var test = _ref5.test;
        return !test;
      });
      if (node.error) doc.errors.push(node.error);

      try {
        if (generic) {
          var res = generic.resolve(doc, node);
          if (!(res instanceof _Collection.default)) res = new _Scalar.default(res);
          node.resolved = res;
        } else {
          var str = (0, _string.resolve)(doc, node);

          if (typeof str === 'string' && tags.length > 0) {
            node.resolved = this.resolveScalar(str, tags);
          }
        }
      } catch (error) {
        if (!error.source) error.source = node;
        doc.errors.push(error);
        node.resolved = null;
      }

      if (!node.resolved) return null;
      if (node.hasProps) node.resolved.anchor = node.anchor;
      if (tagName) node.resolved.tag = tagName;
      return node.resolved;
    }
  }, {
    key: "resolve",
    value: function resolve(doc, node, tagName) {
      var res = this.resolveNode(doc, node, tagName);
      if (node.hasOwnProperty('resolved')) return res;
      var fallback = isMap(node) ? DefaultTags.MAP : isSeq(node) ? DefaultTags.SEQ : DefaultTags.STR;

      if (fallback) {
        var err = doc.errors.push(new _errors.YAMLWarning(node, "The tag ".concat(tagName, " is unavailable, falling back to ").concat(fallback)));
        return this.resolveNode(doc, node, fallback);
      } else {
        doc.errors.push(new _errors.YAMLReferenceError(node, "The tag ".concat(tagName, " is unavailable")));
      }

      return null;
    }
  }, {
    key: "stringify",
    value: function stringify(item, options, onComment) {
      if (item == null || _typeof(item) !== 'object') item = new _Scalar.default(item);
      options.tags = this;
      var match;

      if (item instanceof _Pair.default) {
        return item.toString(this, options, onComment);
      } else if (item.tag) {
        match = this.schema.filter(function (_ref6) {
          var format = _ref6.format,
              tag = _ref6.tag;
          return tag === item.tag && (!item.format || format === item.format);
        });
        if (match.length === 0) throw new Error("Tag not available: ".concat(item.tag).concat(item.format ? ', format ' + item.format : ''));
      } else if (item.value === null) {
        match = this.schema.filter(function (t) {
          return t.class === null && !t.format;
        });
        if (match.length === 0) throw new Error('Schema is missing a null stringifier');
      } else {
        var obj = item;

        if (item.hasOwnProperty('value')) {
          switch (_typeof(item.value)) {
            case 'boolean':
              obj = new Boolean();
              break;

            case 'number':
              obj = new Number();
              break;

            case 'string':
              obj = new String();
              break;

            default:
              obj = item.value;
          }
        }

        match = this.schema.filter(function (t) {
          return t.class && obj instanceof t.class && !t.format;
        });
        if (match.length === 0) throw new Error("Tag not resolved for ".concat(obj && obj.constructor ? obj.constructor.name : _typeof(obj))); // TODO: Handle bare arrays and objects?
      }

      var stringify = match[0].stringify || Tags.defaultStringifier;
      return stringify(item, options, onComment);
    }
  }]);

  return Tags;
}();

exports.default = Tags;