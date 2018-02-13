"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DefaultTags = exports.DefaultTagPrefixes = void 0;

var _rawYaml = require("raw-yaml");

var _errors = require("./errors");

var _schema = _interopRequireDefault(require("./schema"));

var _Pair = _interopRequireDefault(require("./schema/Pair"));

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
  return type === _rawYaml.Type.FLOW_MAP || type === _rawYaml.Type.MAP;
};

var isSeq = function isSeq(_ref2) {
  var type = _ref2.type;
  return type === _rawYaml.Type.FLOW_SEQ || type === _rawYaml.Type.SEQ;
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
          if (match) return resolve.apply(null, match);
        }
      }

      return this.schema.scalarFallback ? this.schema.scalarFallback(str) : str;
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

      try {
        if (generic) return node.resolved = generic.resolve(doc, node);
        var str = node.strValue;

        if (typeof str === 'string' && tags.length > 0) {
          return node.resolved = this.resolveScalar(str, tags);
        }
      } catch (error) {
        if (error instanceof SyntaxError) error = new _errors.YAMLSyntaxError(node, error.message);else error.source = node;
        doc.errors.push(error);
        node.resolved = null;
      }

      return null;
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
    key: "getStringifier",
    value: function getStringifier(value, tag, format) {
      var _this = this;

      var match;

      if (tag) {
        match = this.schema.filter(function (t) {
          return t.tag === tag && (!format || t.format === format);
        });
        if (match.length === 0) throw new Error("Tag not available: ".concat(tag).concat(format ? ', format ' + format : ''));
      } else if (value == null) {
        match = this.schema.filter(function (t) {
          return t.class === null && !t.format;
        });
        if (match.length === 0) match = this.schema.filter(function (t) {
          return t.class === String && !t.format;
        });
      } else if (value instanceof _Pair.default) {
        return function (value, options) {
          return value.toString(_this, options);
        };
      } else {
        var obj;

        switch (_typeof(value)) {
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
            obj = value;
        }

        match = this.schema.filter(function (t) {
          return t.class && obj instanceof t.class && !t.format;
        });
        if (match.length === 0) throw new Error("Tag not resolved for ".concat(obj && obj.constructor ? obj.constructor.name : _typeof(obj))); // TODO: Handle bare arrays and objects
      }

      return match[0].stringify || Tags.defaultStringifier;
    }
  }, {
    key: "stringify",
    value: function stringify(value, options, tag, format) {
      var stringifier = this.getStringifier(value, tag, format);
      return stringifier(value, options);
    }
  }]);

  return Tags;
}();

exports.default = Tags;