"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Node = require("../ast/Node");

var _errors = require("../errors");

var _Collection2 = _interopRequireWildcard(require("./Collection"));

var _Pair = _interopRequireDefault(require("./Pair"));

var _Seq = _interopRequireDefault(require("./Seq"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } _setPrototypeOf(subClass.prototype, superClass && superClass.prototype); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.getPrototypeOf || function _getPrototypeOf(o) { return o.__proto__; }; return _getPrototypeOf(o); }

var YAMLMap =
/*#__PURE__*/
function (_Collection) {
  function YAMLMap() {
    _classCallCheck(this, YAMLMap);

    return _possibleConstructorReturn(this, _getPrototypeOf(YAMLMap).apply(this, arguments));
  }

  _createClass(YAMLMap, [{
    key: "parse",
    value: function parse(ast) {
      var _this = this;

      ast.resolved = this;

      if (ast.type === _Node.Type.FLOW_MAP) {
        this.resolveFlowMapItems(ast);
      } else {
        this.resolveBlockMapItems(ast);
      }

      this.resolveComments();

      for (var i = 0; i < this.items.length; ++i) {
        var iKey = this.items[i].key;

        for (var j = i + 1; j < this.items.length; ++j) {
          var jKey = this.items[j].key;

          if (iKey === jKey || iKey && jKey && iKey.hasOwnProperty('value') && iKey.value === jKey.value) {
            this.doc.errors.push(new _errors.YAMLSemanticError(ast, "Map keys must be unique; \"".concat(iKey, "\" is repeated")));
            break;
          }
        }

        if (this.doc.schema.merge && iKey.value === '<<') {
          var src = this.items[i].value;
          var srcItems = src instanceof _Seq.default ? src.items.reduce(function (acc, _ref) {
            var items = _ref.items;
            return acc.concat(items);
          }, []) : src.items;
          var toAdd = srcItems.reduce(function (toAdd, pair) {
            var exists = _this.items.some(function (_ref2) {
              var key = _ref2.key;
              return key.value === pair.key.value;
            }) || toAdd.some(function (_ref3) {
              var key = _ref3.key;
              return key.value === pair.key.value;
            });
            return exists ? toAdd : toAdd.concat(pair);
          }, []);
          Array.prototype.splice.apply(this.items, [i, 1].concat(_toConsumableArray(toAdd)));
          i += toAdd.length - 1;
        }
      }

      return this;
    }
  }, {
    key: "resolveBlockMapItems",
    value: function resolveBlockMapItems(map) {
      var key = undefined;
      var keyStart = null;

      for (var i = 0; i < map.items.length; ++i) {
        var item = map.items[i];

        switch (item.type) {
          case _Node.Type.COMMENT:
            this.addComment(item.comment);
            break;

          case _Node.Type.MAP_KEY:
            if (key !== undefined) this.items.push(new _Pair.default(key));
            if (item.error) this.doc.errors.push(item.error);
            key = this.doc.resolveNode(item.node);
            keyStart = null;
            break;

          case _Node.Type.MAP_VALUE:
            if (key === undefined) key = null;
            if (item.error) this.doc.errors.push(item.error);

            if (!item.context.atLineStart && item.node && item.node.type === _Node.Type.MAP && !item.node.context.atLineStart) {
              this.doc.errors.push(new _errors.YAMLSemanticError(item.node, 'Nested mappings are not allowed in compact mappings'));
            }

            this.items.push(new _Pair.default(key, this.doc.resolveNode(item.node)));

            _Collection2.default.checkKeyLength(this.doc, map, i, key, keyStart);

            key = undefined;
            keyStart = null;
            break;

          default:
            if (key !== undefined) this.items.push(new _Pair.default(key));
            key = this.doc.resolveNode(item);
            keyStart = item.range.start;
            var nextItem = map.items[i + 1];
            if (!nextItem || nextItem.type !== _Node.Type.MAP_VALUE) this.doc.errors.push(new _errors.YAMLSemanticError(item, 'Implicit map keys need to be followed by map values'));
            if (item.valueRangeContainsNewline) this.doc.errors.push(new _errors.YAMLSemanticError(item, 'Implicit map keys need to be on a single line'));
        }
      }

      if (key !== undefined) this.items.push(new _Pair.default(key));
    }
  }, {
    key: "resolveFlowMapItems",
    value: function resolveFlowMapItems(map) {
      var key = undefined;
      var keyStart = null;
      var explicitKey = false;
      var next = '{';

      for (var i = 0; i < map.items.length; ++i) {
        _Collection2.default.checkKeyLength(this.doc, map, i, key, keyStart);

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

              if (item === ',') {
                next = ':';
                continue;
              }
            }
          }

          if (item === '}') {
            if (i === map.items.length - 1) continue;
          } else if (item === next) {
            next = ':';
            continue;
          }

          this.doc.errors.push(new _errors.YAMLSemanticError(map, "Flow map contains an unexpected ".concat(item)));
        } else if (item.type === _Node.Type.COMMENT) {
          this.addComment(item.comment);
        } else if (key === undefined) {
          if (next === ',') this.doc.errors.push(new _errors.YAMLSemanticError(item, 'Separator , missing in flow map'));
          key = this.doc.resolveNode(item);
          keyStart = explicitKey ? null : item.range.start; // TODO: add error for non-explicit multiline plain key
        } else {
          if (next !== ',') this.doc.errors.push(new _errors.YAMLSemanticError(item, 'Indicator : missing in flow map entry'));
          this.items.push(new _Pair.default(key, this.doc.resolveNode(item)));
          key = undefined;
          explicitKey = false;
        }
      }

      if (map.items[map.items.length - 1] !== '}') this.doc.errors.push(new _errors.YAMLSemanticError(map, 'Expected flow map to end with }'));
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
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var inFlow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var onComment = arguments.length > 2 ? arguments[2] : undefined;
      return _get(_getPrototypeOf(YAMLMap.prototype), "toString", this).call(this, {
        blockItem: function blockItem(_ref5) {
          var str = _ref5.str;
          return str;
        },
        flowChars: {
          start: '{',
          end: '}'
        },
        indent: indent,
        inFlow: inFlow,
        itemIndent: indent + (inFlow ? '  ' : '')
      }, onComment);
    }
  }]);

  _inherits(YAMLMap, _Collection);

  return YAMLMap;
}(_Collection2.default);

exports.default = YAMLMap;