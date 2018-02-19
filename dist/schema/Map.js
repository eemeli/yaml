"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rawYaml = require("raw-yaml");

var _errors = require("../errors");

var _Collection2 = _interopRequireWildcard(require("./Collection"));

var _Pair = _interopRequireDefault(require("./Pair"));

var _Seq = _interopRequireDefault(require("./Seq"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

var YAMLMap =
/*#__PURE__*/
function (_Collection) {
  _inherits(YAMLMap, _Collection);

  function YAMLMap(doc, node) {
    var _this;

    _classCallCheck(this, YAMLMap);

    _this = _possibleConstructorReturn(this, (YAMLMap.__proto__ || Object.getPrototypeOf(YAMLMap)).call(this, doc));
    node.resolved = _assertThisInitialized(_this);

    if (node.type === _rawYaml.Type.FLOW_MAP) {
      _this.resolveFlowMapItems(doc, node);
    } else {
      _this.resolveBlockMapItems(doc, node);
    }

    for (var i = 0; i < _this.items.length; ++i) {
      var key = _this.items[i].key;

      for (var j = i + 1; j < _this.items.length; ++j) {
        if (_this.items[j].key === key) {
          doc.errors.push(new _errors.YAMLSyntaxError(node, "Map keys must be unique; \"".concat(key, "\" is repeated")));
          break;
        }
      }

      if (doc.options.merge && key === '<<') {
        var src = _this.items[i].value;
        var srcItems = src instanceof _Seq.default ? src.items.reduce(function (acc, _ref) {
          var items = _ref.items;
          return acc.concat(items);
        }, []) : src.items;
        var toAdd = srcItems.reduce(function (toAdd, pair) {
          var exists = _this.items.some(function (_ref2) {
            var key = _ref2.key;
            return key === pair.key;
          }) || toAdd.some(function (_ref3) {
            var key = _ref3.key;
            return key === pair.key;
          });
          return exists ? toAdd : toAdd.concat(pair);
        }, []);
        Array.prototype.splice.apply(_this.items, [i, 1].concat(_toConsumableArray(toAdd)));
        i += toAdd.length - 1;
      }
    }

    return _this;
  }

  _createClass(YAMLMap, [{
    key: "resolveBlockMapItems",
    value: function resolveBlockMapItems(doc, map) {
      var key = undefined;
      var keyStart = null;

      for (var i = 0; i < map.items.length; ++i) {
        var item = map.items[i];

        switch (item.type) {
          case _rawYaml.Type.COMMENT:
            this.addComment(item.comment);
            break;

          case _rawYaml.Type.MAP_KEY:
            if (key !== undefined) this.items.push(new _Pair.default(key));
            key = doc.resolveNode(item.node);
            keyStart = null;
            break;

          case _rawYaml.Type.MAP_VALUE:
            if (key === undefined) key = null;
            this.items.push(new _Pair.default(key, doc.resolveNode(item.node)));

            _Collection2.default.checkKeyLength(doc, map, i, key, keyStart);

            key = undefined;
            keyStart = null;
            break;

          default:
            if (key !== undefined) this.items.push(new _Pair.default(key));
            key = doc.resolveNode(item);
            keyStart = item.range.start;
        }
      }

      if (key !== undefined) this.items.push(new _Pair.default(key));
    }
  }, {
    key: "resolveFlowMapItems",
    value: function resolveFlowMapItems(doc, map) {
      var key = undefined;
      var keyStart = null;
      var explicitKey = false;
      var next = '{';

      for (var i = 0; i < map.items.length; ++i) {
        _Collection2.default.checkKeyLength(doc, map, i, key, keyStart);

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
              if (key === undefined && item !== ',') key = null;
              explicitKey = false;
            }

            if (key !== undefined) {
              this.items.push(new _Pair.default(key));
              key = undefined;
              keyStart = null;
            }
          }

          if (item === '}') {
            if (i === map.items.length - 1) continue;
          } else if (item === next || next === ':' && item === ',') {
            next = ':';
            continue;
          }

          doc.errors.push(new _errors.YAMLSyntaxError(map, "Flow map contains an unexpected ".concat(item)));
        } else if (item.type === _rawYaml.Type.COMMENT) {
          this.addComment(item.comment);
        } else if (key === undefined) {
          if (next === ',') doc.errors.push(new _errors.YAMLSyntaxError(item, 'Separator , missing in flow map'));
          key = doc.resolveNode(item);
          keyStart = explicitKey ? null : item.range.start; // TODO: add error for non-explicit multiline plain key
        } else {
          if (next !== ',') doc.errors.push(new _errors.YAMLSyntaxError(item, 'Indicator : missing in flow map entry'));
          this.items.push(new _Pair.default(key, doc.resolveNode(item)));
          key = undefined;
        }
      }

      if (key !== undefined) this.items.push(new _Pair.default(key));
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.items.reduce(function (map, _ref4) {
        var stringKey = _ref4.stringKey,
            value = _ref4.value;
        map[stringKey] = (0, _Collection2.toJSON)(value);
        return map;
      }, {});
    }
  }, {
    key: "toString",
    value: function toString(indent, inFlow) {
      var tags = this.doc.tags;
      var options = {
        indent: indent,
        inFlow: inFlow,
        type: null
      };
      var items = this.items.map(function (pair) {
        return pair.toString(tags, options);
      });

      if (inFlow || items.length === 0) {
        // return `{\n  ${indent}${items.join(`,\n  ${indent}`)}\n${indent}}`
        return "{ ".concat(items.join(', '), " }");
      } else {
        return items.join("\n".concat(indent));
      }
    }
  }]);

  return YAMLMap;
}(_Collection2.default);

exports.default = YAMLMap;