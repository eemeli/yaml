"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Node = require("./ast/Node");

var _errors = require("./errors");

var _Tags = require("./Tags");

var _Collection = require("./schema/Collection");

function _sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return _sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Document =
/*#__PURE__*/
function () {
  _createClass(Document, [{
    key: "parseTagDirective",
    value: function parseTagDirective(directive) {
      var _directive$parameters = _slicedToArray(directive.parameters, 2),
          handle = _directive$parameters[0],
          prefix = _directive$parameters[1];

      if (handle && prefix) {
        if (this.tagPrefixes[handle]) this.errors.push(new _errors.YAMLSyntaxError(directive, 'The TAG directive must only be given at most once per handle in the same document.'));
        this.tagPrefixes[handle] = prefix;
      } else {
        this.errors.push(new _errors.YAMLSyntaxError(directive, 'Insufficient parameters given for TAG directive'));
      }
    }
  }, {
    key: "parseYamlDirective",
    value: function parseYamlDirective(directive) {
      var _directive$parameters2 = _slicedToArray(directive.parameters, 1),
          version = _directive$parameters2[0];

      if (this.version) this.errors.push(new _errors.YAMLSyntaxError(directive, 'The YAML directive must only be given at most once per document.'));
      if (!version) this.errors.push(new _errors.YAMLSyntaxError(directive, 'Insufficient parameters given for YAML directive'));else if (version !== '1.2') this.errors.push(new _errors.YAMLWarning(directive, "Document will be parsed as YAML 1.2 rather than YAML ".concat(version)));
      this.version = version;
    }
  }]);

  function Document(tags) {
    var _this = this;

    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$directives = _ref.directives,
        directives = _ref$directives === void 0 ? [] : _ref$directives,
        _ref$contents = _ref.contents,
        contents = _ref$contents === void 0 ? [] : _ref$contents,
        error = _ref.error;

    var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        merge = _ref2.merge;

    _classCallCheck(this, Document);

    this.anchors = [];
    this.directives = directives;
    this.errors = [];

    if (error) {
      if (!error.source) error.source = this;
      this.errors.push(error);
    }

    this.options = {
      merge: merge
    };
    this.rawContents = contents;
    this.tagPrefixes = {};
    this.tags = tags;
    this.version = null;
    directives.forEach(function (directive) {
      var name = directive.name;

      switch (name) {
        case 'TAG':
          _this.parseTagDirective(directive);

          break;

        case 'YAML':
          _this.parseYamlDirective(directive);

          break;

        default:
          if (name) _this.errors.push(new _errors.YAMLWarning(directive, "YAML 1.2 only supports TAG and YAML directives, and not ".concat(name)));
      }
    });
    var contentNodes = contents.filter(function (node) {
      return node.valueRange && !node.valueRange.isEmpty;
    }).map(function (node) {
      return _this.resolveNode(node);
    });

    switch (contentNodes.length) {
      case 0:
        this.contents = null;
        break;

      case 1:
        this.contents = contentNodes[0];
        break;

      default:
        this.errors.push(new _errors.YAMLSyntaxError(null, 'Document is not valid YAML (bad indentation?)'));
        this.contents = contentNodes;
    }
  }

  _createClass(Document, [{
    key: "resolveTagName",
    value: function resolveTagName(node) {
      var tag = node.tag,
          type = node.type;
      var nonSpecific = false;

      if (tag) {
        var handle = tag.handle,
            suffix = tag.suffix,
            verbatim = tag.verbatim;

        if (verbatim) {
          if (verbatim !== '!' && verbatim !== '!!') return verbatim;
          this.errors.push(new _errors.YAMLSyntaxError(node, "Verbatim tags aren't resolved, so ".concat(verbatim, " is invalid.")));
        } else if (handle === '!' && !suffix) {
          nonSpecific = true;
        } else {
          var prefix = this.tagPrefixes[handle] || _Tags.DefaultTagPrefixes[handle];

          if (prefix) {
            if (suffix) return prefix + suffix;
            this.errors.push(new _errors.YAMLSyntaxError(node, "The ".concat(handle, " tag has no suffix.")));
          } else {
            this.errors.push(new _errors.YAMLSyntaxError(node, "The ".concat(handle, " tag handle is non-default and was not declared.")));
          }
        }
      }

      switch (type) {
        case _Node.Type.BLOCK_FOLDED:
        case _Node.Type.BLOCK_LITERAL:
        case _Node.Type.QUOTE_DOUBLE:
        case _Node.Type.QUOTE_SINGLE:
          return _Tags.DefaultTags.STR;

        case _Node.Type.FLOW_MAP:
        case _Node.Type.MAP:
          return _Tags.DefaultTags.MAP;

        case _Node.Type.FLOW_SEQ:
        case _Node.Type.SEQ:
          return _Tags.DefaultTags.SEQ;

        case _Node.Type.PLAIN:
          return nonSpecific ? _Tags.DefaultTags.STR : null;

        default:
          return null;
      }
    }
  }, {
    key: "resolveNode",
    value: function resolveNode(node) {
      if (!node) return null;
      var anchors = this.anchors,
          errors = this.errors,
          tags = this.tags;
      var hasAnchor = false;
      var hasTag = false;
      node.props.forEach(function (_ref3) {
        var start = _ref3.start,
            end = _ref3.end;

        switch (node.context.src[start]) {
          case _Node.Char.COMMENT:
            if (!node.commentHasRequiredWhitespace(start)) errors.push(new _errors.YAMLSyntaxError(node, 'Comments must be separated from other tokens by white space characters'));
            break;

          case _Node.Char.ANCHOR:
            if (hasAnchor) errors.push(new _errors.YAMLSyntaxError(node, 'A node can have at most one anchor'));
            hasAnchor = true;
            break;

          case _Node.Char.TAG:
            if (hasTag) errors.push(new _errors.YAMLSyntaxError(node, 'A node can have at most one tag'));
            hasTag = true;
            break;
        }
      });
      var anchor = node.anchor;
      if (anchor) anchors[anchor] = node;

      if (node.type === _Node.Type.ALIAS) {
        if (hasAnchor || hasTag) errors.push(new _errors.YAMLSyntaxError(node, 'An alias node must not specify any properties'));
        var src = anchors[node.rawValue];
        if (src) return node.resolved = src.resolved;
        errors.push(new _errors.YAMLReferenceError(node, "Aliased anchor not found: ".concat(node.rawValue)));
        return null;
      }

      var tagName = this.resolveTagName(node);
      if (tagName) return node.resolved = tags.resolve(this, node, tagName);
      if (node.type === _Node.Type.PLAIN) try {
        return node.resolved = tags.resolveScalar(node.strValue || '');
      } catch (error) {
        if (!error.source) error.source = node;
        errors.push(error);
        return null;
      }
      errors.push(new _errors.YAMLSyntaxError(node, "Failed to resolve ".concat(node.type, " node here")));
      return null;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return (0, _Collection.toJSON)(this.contents);
    }
  }, {
    key: "toString",
    value: function toString() {
      var _this2 = this;

      if (Array.isArray(this.contents)) {
        return this.contents.map(function (c) {
          return _this2.tags.stringify(c, {
            indent: ''
          });
        }).join('\n---\n') + '\n';
      }

      return this.tags.stringify(this.contents, {
        indent: ''
      }) + '\n';
    }
  }]);

  return Document;
}();

exports.default = Document;