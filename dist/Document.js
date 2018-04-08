"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Node = require("./ast/Node");

var _errors = require("./errors");

var _Tags = require("./Tags");

var _Collection = _interopRequireWildcard(require("./schema/Collection"));

var _Node2 = require("./schema/Node");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return _sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var isCollectionItem = function isCollectionItem(node) {
  return node && [_Node.Type.MAP_KEY, _Node.Type.MAP_VALUE, _Node.Type.SEQ_ITEM].includes(node.type);
};

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
    var directiveComments = [];
    directives.forEach(function (directive) {
      var comment = directive.comment,
          name = directive.name;

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

      if (comment) directiveComments.push(comment);
    });
    this.commentBefore = directiveComments.join('\n') || null;
    var comments = {
      before: [],
      after: []
    };
    var contentNodes = [];
    contents.forEach(function (node) {
      if (node.valueRange && !node.valueRange.isEmpty) {
        contentNodes.push(_this.resolveNode(node));
      } else if (node.comment) {
        var cc = contentNodes.length === 0 ? comments.before : comments.after;
        cc.push(node.comment);
      }
    });

    switch (contentNodes.length) {
      case 0:
        this.contents = null;
        comments.after = comments.before;
        break;

      case 1:
        this.contents = contentNodes[0];

        if (this.contents) {
          var cb = comments.before.join('\n') || null;

          if (cb) {
            var cbNode = this.contents instanceof _Collection.default && this.contents.items[0] ? this.contents.items[0] : this.contents;
            cbNode.commentBefore = cbNode.commentBefore ? "".concat(cb, "\n").concat(cbNode.commentBefore) : cb;
          }
        } else {
          comments.after = comments.before.concat(comments.after);
        }

        break;

      default:
        this.errors.push(new _errors.YAMLSyntaxError(null, 'Document is not valid YAML (bad indentation?)'));
        this.contents = contentNodes;
        if (this.contents[0]) this.contents[0].commentBefore = comments.before.join('\n') || null;else comments.after = comments.before.concat(comments.after);
    }

    this.comment = comments.after.join('\n') || null;
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
      var comments = {
        before: [],
        after: []
      };
      var props = isCollectionItem(node.context.parent) ? node.context.parent.props.concat(node.props) : node.props;
      props.forEach(function (_ref3, i) {
        var start = _ref3.start,
            end = _ref3.end;

        switch (node.context.src[start]) {
          case _Node.Char.COMMENT:
            if (!node.commentHasRequiredWhitespace(start)) errors.push(new _errors.YAMLSyntaxError(node, 'Comments must be separated from other tokens by white space characters'));
            var c = node.context.src.slice(start + 1, end);
            var header = node.header,
                valueRange = node.valueRange;

            if (valueRange && (start > valueRange.start || header && start > header.start)) {
              comments.after.push(c);
            } else {
              comments.before.push(c);
            }

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
      if (hasAnchor) anchors[node.anchor] = node;
      var res;

      if (node.type === _Node.Type.ALIAS) {
        if (hasAnchor || hasTag) errors.push(new _errors.YAMLSyntaxError(node, 'An alias node must not specify any properties'));
        var src = anchors[node.rawValue];

        if (!src) {
          errors.push(new _errors.YAMLReferenceError(node, "Aliased anchor not found: ".concat(node.rawValue)));
          return null;
        }

        res = src.resolved;
      } else {
        var tagName = this.resolveTagName(node);

        if (tagName) {
          res = tags.resolve(this, node, tagName);
        } else {
          if (node.type !== _Node.Type.PLAIN) {
            errors.push(new _errors.YAMLSyntaxError(node, "Failed to resolve ".concat(node.type, " node here")));
            return null;
          }

          try {
            res = tags.resolveScalar(node.strValue || '');
          } catch (error) {
            if (!error.source) error.source = node;
            errors.push(error);
            return null;
          }
        }
      }

      if (res) {
        var cb = comments.before.join('\n');
        if (cb) res.commentBefore = res.commentBefore ? "".concat(res.commentBefore, "\n").concat(cb) : cb;
        var ca = comments.after.join('\n');
        if (ca) res.comment = res.comment ? "".concat(res.comment, "\n").concat(ca) : ca;
      }

      return node.resolved = res;
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

      var contents = this.contents;

      if (Array.isArray(contents)) {
        if (contents.length <= 1) contents = contents[0] || null;else throw new Error('Document with multiple content nodes cannot be stringified');
      }

      var lines = this.directives.filter(function (_ref4) {
        var comment = _ref4.comment;
        return comment;
      }).map(function (_ref5) {
        var comment = _ref5.comment;
        return comment.replace(/^/gm, '#');
      });
      var hasDirectives = false;

      if (this.version) {
        lines.push('%YAML 1.2');
        hasDirectives = true;
      }

      Object.keys(this.tagPrefixes).forEach(function (handle) {
        var prefix = _this2.tagPrefixes[handle];
        lines.push("%TAG ".concat(handle, " ").concat(prefix));
        hasDirectives = true;
      });
      if (hasDirectives) lines.push('---');

      if (contents) {
        if (contents.commentBefore) lines.push(contents.commentBefore.replace(/^/gm, '#'));
        var options = {
          // top-level block scalars need to be indented if followed by a comment
          forceBlockIndent: !!this.comment,
          indent: ''
        };
        var comment = contents.comment;
        var body = this.tags.stringify(contents, options, function () {
          comment = null;
        });
        lines.push((0, _Node2.addComment)(body, '', comment));
      }

      if (this.comment) lines.push(this.comment.replace(/^/gm, '#'));
      return lines.join('\n') + '\n';
    }
  }]);

  return Document;
}();

exports.default = Document;