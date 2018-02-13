"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Map = void 0;

var _rawYaml = require("raw-yaml");

var _Collection2 = _interopRequireWildcard(require("./Collection"));

var _errors = require("./errors");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

var Map =
/*#__PURE__*/
function (_Collection) {
  _inherits(Map, _Collection);

  function Map(doc, node) {
    var _this;

    _classCallCheck(this, Map);

    _this = _possibleConstructorReturn(this, (Map.__proto__ || Object.getPrototypeOf(Map)).call(this));
    node.resolved = _assertThisInitialized(_this);

    if (node.type === _rawYaml.Type.FLOW_MAP) {
      _this.resolveFlowMapItems(doc, node);
    } else {
      _this.resolveBlockMapItems(doc, node);
    }

    for (var i = 0; i < _this.items.length - 1; ++i) {
      var key = _this.items[i].key;

      for (var j = i + 1; j < _this.items.length; ++j) {
        if (_this.items[j].key === key) {
          doc.errors.push(new _errors.YAMLSyntaxError(node, "Map keys must be unique; ".concat(key, " is repeated")));
          break;
        }
      }
    }

    return _this;
  }

  _createClass(Map, [{
    key: "resolveBlockMapItems",
    value: function resolveBlockMapItems(doc, map) {
      var key = undefined;

      for (var i = 0; i < map.items.length; ++i) {
        var item = map.items[i];

        switch (item.type) {
          case _rawYaml.Type.COMMENT:
            this.addComment(item.comment);
            break;

          case _rawYaml.Type.MAP_KEY:
            if (key !== undefined) this.items.push(new _Collection2.Pair(key));
            key = doc.resolveNode(item.node);
            break;

          case _rawYaml.Type.MAP_VALUE:
            this.items.push(new _Collection2.Pair(key, doc.resolveNode(item.node)));
            key = undefined;
            break;

          default:
            if (key !== undefined) this.items.push(new _Collection2.Pair(key));
            key = doc.resolveNode(item);
        }
      }
    }
  }, {
    key: "resolveFlowMapItems",
    value: function resolveFlowMapItems(doc, map) {
      var key = undefined;
      var explicitKey = false;
      var next = '{';

      for (var i = 0; i < map.items.length; ++i) {
        var item = map.items[i];

        if (typeof item === 'string') {
          if (item === '?' && key === undefined && !explicitKey) {
            explicitKey = true;
            next = ':';
            continue;
          }

          if (item === ':') {
            if (key === undefined) key = null;

            if (next === ':') {
              next = ',';
              continue;
            }
          } else {
            if (explicitKey) {
              if (key === undefined) key = null;
              explicitKey = false;
            }

            if (key !== undefined) {
              this.items.push(new _Collection2.Pair(key));
              key === undefined;
            }
          }

          if (item === '}') {
            if (i === map.items.length - 1) continue;
          } else if (item === next) {
            next = ':';
            continue;
          }

          doc.errors.push(new _errors.YAMLSyntaxError(map, "Flow map contains an unexpected ".concat(item)));
        } else if (item.type === _rawYaml.Type.COMMENT) {
          this.addComment(item.comment);
        } else if (key === undefined) {
          if (next === ',') doc.errors.push(new _errors.YAMLSyntaxError(item, 'Separator , missing in flow map'));
          key = doc.resolveNode(item); // TODO: add error for non-explicit multiline plain key
        } else {
          if (next !== ',') doc.errors.push(new _errors.YAMLSyntaxError(item, 'Indicator : missing in flow map entry'));
          this.items.push(new _Collection2.Pair(key, doc.resolveNode(item)));
          key = undefined;
        }
      }

      if (key !== undefined) this.items.push(new _Collection2.Pair(key));
    }
  }, {
    key: "asPlainObject",
    get: function get() {
      var _this2 = this;

      var comments = this.comments.reduce(function (cc, _ref) {
        var before = _ref.before,
            comment = _ref.comment;
        var node = _this2.items[before];
        var key = node ? node.stringKey : null;
        if (cc[key]) cc[key] += '\n' + comment;else cc[key] = comment;
        return cc;
      }, {});

      var MapObject =
      /*#__PURE__*/
      function () {
        function MapObject() {
          _classCallCheck(this, MapObject);
        }

        _createClass(MapObject, [{
          key: "_comments",
          value: function _comments() {
            return comments;
          }
        }]);

        return MapObject;
      }();

      var map = new MapObject();

      for (var i = 0; i < this.items.length; ++i) {
        var _items$i = this.items[i],
            plainValue = _items$i.plainValue,
            stringKey = _items$i.stringKey;
        map[stringKey] = plainValue;
      }

      return map;
    }
  }]);

  return Map;
}(_Collection2.default);

exports.Map = Map;