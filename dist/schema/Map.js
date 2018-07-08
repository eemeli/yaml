"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _toJSON2 = _interopRequireDefault(require("../toJSON"));

var _Collection2 = _interopRequireDefault(require("./Collection"));

var _Merge = _interopRequireDefault(require("./Merge"));

var _Pair = _interopRequireDefault(require("./Pair"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var YAMLMap =
/*#__PURE__*/
function (_Collection) {
  _inherits(YAMLMap, _Collection);

  function YAMLMap() {
    _classCallCheck(this, YAMLMap);

    return _possibleConstructorReturn(this, _getPrototypeOf(YAMLMap).apply(this, arguments));
  }

  _createClass(YAMLMap, [{
    key: "toJSON",
    value: function toJSON(_, keep) {
      return this.items.reduce(function (map, item) {
        if (item instanceof _Merge.default) {
          (function () {
            // If the value associated with a merge key is a single mapping node,
            // each of its key/value pairs is inserted into the current mapping,
            // unless the key already exists in it. If the value associated with the
            // merge key is a sequence, then this sequence is expected to contain
            // mapping nodes and each of these nodes is merged in turn according to
            // its order in the sequence. Keys in mapping nodes earlier in the
            // sequence override keys specified in later mapping nodes.
            // -- http://yaml.org/type/merge.html
            var keys = Object.keys(map);
            var items = item.value.items;

            for (var i = items.length - 1; i >= 0; --i) {
              var source = items[i].source;

              if (source instanceof YAMLMap) {
                (function () {
                  var obj = source.toJSON('', keep);
                  Object.keys(obj).forEach(function (key) {
                    if (!keys.includes(key)) map[key] = obj[key];
                  });
                })();
              } else {
                throw new Error('Merge sources must be maps');
              }
            }
          })();
        } else {
          var stringKey = item.stringKey,
              value = item.value;
          map[stringKey] = (0, _toJSON2.default)(value, stringKey, keep);
        }

        return map;
      }, {});
    }
  }, {
    key: "toString",
    value: function toString(ctx, onComment) {
      if (!ctx) return JSON.stringify(this);
      this.items.forEach(function (item) {
        if (!(item instanceof _Pair.default)) throw new Error("Map items must all be pairs; found ".concat(JSON.stringify(item), " instead"));
      });
      return _get(_getPrototypeOf(YAMLMap.prototype), "toString", this).call(this, ctx, {
        blockItem: function blockItem(_ref) {
          var str = _ref.str;
          return str;
        },
        flowChars: {
          start: '{',
          end: '}'
        },
        itemIndent: ctx.indent || ''
      }, onComment);
    }
  }]);

  return YAMLMap;
}(_Collection2.default);

exports.default = YAMLMap;