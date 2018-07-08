"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Alias = _interopRequireDefault(require("./schema/Alias"));

var _Map = _interopRequireDefault(require("./schema/Map"));

var _Merge = _interopRequireDefault(require("./schema/Merge"));

var _Scalar = _interopRequireDefault(require("./schema/Scalar"));

var _Seq = _interopRequireDefault(require("./schema/Seq"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Anchors =
/*#__PURE__*/
function () {
  function Anchors() {
    _classCallCheck(this, Anchors);

    _defineProperty(this, "map", {});
  }

  _createClass(Anchors, [{
    key: "createAlias",
    value: function createAlias(node, name) {
      this.setAnchor(node, name);
      return new _Alias.default(node);
    }
  }, {
    key: "createMergePair",
    value: function createMergePair() {
      var _this = this;

      var merge = new _Merge.default();

      for (var _len = arguments.length, sources = new Array(_len), _key = 0; _key < _len; _key++) {
        sources[_key] = arguments[_key];
      }

      merge.value.items = sources.map(function (s) {
        if (s instanceof _Alias.default) {
          if (s.source instanceof _Map.default) return s;
        } else if (s instanceof _Map.default) {
          return _this.createAlias(s);
        }

        throw new Error('Merge sources must be Map nodes or their Aliases');
      });
      return merge;
    }
  }, {
    key: "getName",
    value: function getName(node) {
      var map = this.map;
      return Object.keys(map).find(function (a) {
        return map[a] === node;
      });
    }
  }, {
    key: "getNode",
    value: function getNode(name) {
      return this.map[name];
    }
  }, {
    key: "newName",
    value: function newName(prefix) {
      var names = Object.keys(this.map);

      for (var i = 1; true; ++i) {
        var name = "".concat(prefix).concat(i);
        if (!names.includes(name)) return name;
      }
    } // During parsing, map & aliases contain CST nodes

  }, {
    key: "resolveNodes",
    value: function resolveNodes() {
      var map = this.map,
          _cstAliases = this._cstAliases;
      Object.keys(map).forEach(function (a) {
        map[a] = map[a].resolved;
      });

      _cstAliases.forEach(function (a) {
        a.source = a.source.resolved;
      });

      delete this._cstAliases;
    }
  }, {
    key: "setAnchor",
    value: function setAnchor(node, name) {
      if (node != null && !Anchors.validAnchorNode(node)) {
        throw new Error('Anchors may only be set for Scalar, Seq and Map nodes');
      }

      if (name && /[\x00-\x19\s,[\]{}]/.test(name)) {
        throw new Error('Anchor names must not contain whitespace or control characters');
      }

      var map = this.map;
      var prev = node && Object.keys(map).find(function (a) {
        return map[a] === node;
      });

      if (prev) {
        if (!name) {
          return prev;
        } else if (prev !== name) {
          delete map[prev];
          map[name] = node;
        }
      } else {
        if (!name) {
          if (!node) return null;
          name = this.newName('a');
        }

        map[name] = node;
      }

      return name;
    }
  }], [{
    key: "validAnchorNode",
    value: function validAnchorNode(node) {
      return node instanceof _Scalar.default || node instanceof _Seq.default || node instanceof _Map.default;
    }
  }]);

  return Anchors;
}();

exports.default = Anchors;