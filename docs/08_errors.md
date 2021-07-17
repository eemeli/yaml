# Errors

Nearly all errors and warnings produced by the `yaml` parser functions contain the following fields:

| Member  | Type                                 | Description                                                                                                                         |
| ------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| code    | `string`                             | An identifier for the error type.                                                                                                   |
| linePos | `[LinePos, LinePos] ⎮` `undefined`   | If `prettyErrors` is enabled and `offset` is known, the one-indexed human-friendly source location `{ line: number, col: number }`. |
| name    | `'YAMLParseError' ⎮` `'YAMLWarning'` |                                                                                                                                     |
| message | `string`                             | A human-readable description of the error                                                                                           |
| pos     | `[number, number]`                   | The position in the source at which this error or warning was encountered.                                                          |

A `YAMLParseError` is an error encountered while parsing a source as YAML.
They are included in the `doc.errors` array.
If that array is not empty when constructing a native representation of a document, the first error will be thrown.

A `YAMLWarning` is not an error, but a spec-mandated warning about unsupported directives or a fallback resolution being used for a node with an unavailable tag.
They are included in the `doc.warnings` array.

In rare cases, the library may produce a more generic error.
In particular, `TypeError` may occur when parsing invalid input using the `json` schema, and `ReferenceError` when the `maxAliasCount` limit is enountered.

To identify errors for special handling, you should primarily use `code` to differentiate them from each other.

| Code                     | Description                                                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ALIAS_PROPS`            | Unlike scalars and collections, alias nodes cannot have an anchor or tag associated with it.                                                                                 |
| `BAD_ALIAS`              | An alias identifier must be a non-empty sequence of valid characters.                                                                                                        |
| `BAD_DIRECTIVE`          | Only the `%YAML` and `%TAG` directives are supported, and they need to follow the specified structure.                                                                       |
| `BAD_DQ_ESCAPE`          | Double-quotes strings may include `\` escaped content, but that needs to be valid.                                                                                           |
| `BAD_INDENT`             | Indentation is important in YAML, and collection items need to all start at the same level. Block scalars are also picky about their leading content.                        |
| `BAD_PROP_ORDER`         | Anchors and tags must be placed after the `?`, `:` and `-` indicators.                                                                                                       |
| `BAD_SCALAR_START`       | Plain scalars cannot start with a block scalar indicator, or one of the two reserved characters: `@` and <code>`</code>. To fix, use a block or quoted scalar for the value. |
| `BLOCK_AS_IMPLICIT_KEY`  | There's probably something wrong with the indentation, or you're trying to parse something like `a: b: c`, where it's not clear what's the key and what's the value.         |
| `BLOCK_IN_FLOW`          | YAML scalars and collections both have block and flow styles. Flow is allowed within block, but not the other way around.                                                    |
| `DUPLICATE_KEY`          | Map keys must be unique. Use the `uniqueKeys` option to disable or customise this check when parsing.                                                                        |
| `IMPOSSIBLE`             | This really should not happen. If you encounter this error code, please file a bug.                                                                                          |
| `KEY_OVER_1024_CHARS`    | Due to legacy reasons, implicit keys must have their following `:` indicator after at most 1k characters.                                                                    |
| `MISSING_ANCHOR`         | Aliases can only dereference anchors that are before them in the document.                                                                                                   |
| `MISSING_CHAR`           | Some character or characters are missing here. See the error message for what you need to add.                                                                               |
| `MULTILINE_IMPLICIT_KEY` | Implicit keys need to be on a single line. Does the input include a plain scalar with a `:` followed by whitespace, which is getting parsed as a map key?                    |
| `MULTIPLE_ANCHORS`       | A node is only allowed to have one anchor.                                                                                                                                   |
| `MULTIPLE_DOCS`          | A YAML stream may include multiple documents. If yours does, you'll need to use `parseAllDocuments()` to work with it.                                                       |
| `MULTIPLE_TAGS`          | A node is only allowed to have one tag.                                                                                                                                      |
| `TAB_AS_INDENT`          | Only spaces are allowed as indentation.                                                                                                                                      |
| `TAG_RESOLVE_FAILED`     | Something went wrong when resolving a node's tag with the current schema.                                                                                                    |
| `UNEXPECTED_TOKEN`       | A token was encountered in a place where it wasn't expected.                                                                                                                 |

## Silencing Errors and Warnings

Some of the errors encountered during parsing are required by the spec, but are caused by content that may be parsed unambiguously.
To ignore these errors, use the `strict: false` option:

- `MULTILINE_IMPLICIT_KEY`: Implicit keys of flow sequence pairs need to be on a single line
- `KEY_OVER_1024_CHARS`: The : indicator must be at most 1024 chars after the start of an implicit block mapping key

For additional control, set the `logLevel` option to `'error'` (default: `'warn'`) to silence all warnings.
Setting `logLevel: 'silent'` will ignore parsing errors completely, resulting in output that may well be rather broken.
