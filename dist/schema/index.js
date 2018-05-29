"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DefaultTags = exports.DefaultTagPrefixes = exports.availableSchema = void 0;

var _Node = require("../ast/Node");

var _errors = require("../errors");

var _Collection = _interopRequireDefault(require("./Collection"));

var _core = _interopRequireDefault(require("./core"));

var _extended = _interopRequireDefault(require("./extended"));

var _failsafe = _interopRequireDefault(require("./failsafe"));

var _json = _interopRequireDefault(require("./json"));

var _Pair = _interopRequireDefault(require("./Pair"));

var _Scalar = _interopRequireDefault(require("./Scalar"));

var _string = require("./_string");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var availableSchema = {
  core: _core.default,
  extended: _extended.default,
  failsafe: _failsafe.default,
  json: _json.default
};
exports.availableSchema = availableSchema;
var defaultPrefix = 'tag:yaml.org,2002:';
var DefaultTagPrefixes = [{
  handle: '!',
  prefix: '!'
}, {
  handle: '!!',
  prefix: defaultPrefix
}];
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

var Schema =
/*#__PURE__*/
function () {
  _createClass(Schema, null, [{
    key: "defaultStringifier",
    value: function defaultStringifier(value) {
      return JSON.stringify(value);
    }
  }]);

  function Schema(_ref3) {
    var merge = _ref3.merge,
        schema = _ref3.schema,
        tags = _ref3.tags;

    _classCallCheck(this, Schema);

    this.merge = !!merge;
    this.schema = Array.isArray(schema) ? schema : availableSchema[schema];

    if (!this.schema) {
      var keys = Object.keys(availableSchema).map(function (key) {
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


  _createClass(Schema, [{
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
    key: "resolveNodeWithFallback",
    value: function resolveNodeWithFallback(doc, node, tagName) {
      var res = this.resolveNode(doc, node, tagName);
      if (node.hasOwnProperty('resolved')) return res;
      var fallback = isMap(node) ? DefaultTags.MAP : isSeq(node) ? DefaultTags.SEQ : DefaultTags.STR;

      if (fallback) {
        doc.warnings.push(new _errors.YAMLWarning(node, "The tag ".concat(tagName, " is unavailable, falling back to ").concat(fallback)));

        var _res = this.resolveNode(doc, node, fallback);

        _res.origTag = tagName;
        return _res;
      } else {
        doc.errors.push(new _errors.YAMLReferenceError(node, "The tag ".concat(tagName, " is unavailable")));
      }

      return null;
    }
  }, {
    key: "stringify",
    value: function stringify(doc, item, options, onComment) {
      if (!(item instanceof _Scalar.default || item instanceof _Collection.default || item instanceof _Pair.default)) {
        item = doc.resolveValue(item, true);
      }

      options.tags = this;
      var match;

      if (item instanceof _Pair.default) {
        return item.toString(doc, options, onComment);
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
        if (match.length === 0) throw new Error("Tag not resolved for ".concat(obj && obj.constructor ? obj.constructor.name : _typeof(obj)));
      }

      var stringify = match[0].stringify || Schema.defaultStringifier;
      var str = stringify(item, options, onComment);
      var tag = item.origTag || item.tag;

      if (tag && tag.indexOf(defaultPrefix) !== 0) {
        var p = doc.tagPrefixes.find(function (p) {
          return tag.indexOf(p.prefix) === 0;
        });
        var tagProp = p ? p.handle + tag.substr(p.prefix.length) : tag[0] === '!' ? tag : "!<".concat(tag, ">");

        if (item instanceof _Collection.default && !options.inFlow && item.items.length > 0) {
          return "".concat(tagProp, "\n").concat(options.indent).concat(str);
        } else {
          return "".concat(tagProp, " ").concat(str);
        }
      }

      return str;
    }
  }]);

  return Schema;
}();

exports.default = Schema;