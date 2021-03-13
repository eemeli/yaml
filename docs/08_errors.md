# Errors

Nearly all errors and warnings produced by the `yaml` parser functions contain the following fields:

| Member  | Type                                          | Description                                                                                                                 |
| ------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| linePos | `{ line: number, col: number } ⎮` `undefined` | If `prettyErrors` is enabled and `offset` is known, the one-indexed human-friendly source location.                         |
| name    | `'YAMLParseError' ⎮` `'YAMLWarning'`          |                                                                                                                             |
| message | `string`                                      | A human-readable description of the error                                                                                   |
| offset  | `number`                                      | The offset in the source at which this error or warning was encountered. May be `-1` if the offset could not be determined. |

A `YAMLParseError` is an error encountered while parsing a source as YAML.
They are included in the `doc.errors` array.
If that array is not empty when constructing a native representation of a document, the first error will be thrown.

A `YAMLWarning` is not an error, but a spec-mandated warning about unsupported directives or a fallback resolution being used for a node with an unavailable tag.
They are included in the `doc.warnings` array.

In rare cases, the library may produce a more generic error. In particular, `TypeError` may occur when parsing invalid input using the `json` schema, and `ReferenceError` when the `maxAliasCount` limit is enountered.

## Silencing Errors and Warnings

Some of the errors encountered during parsing are required by the spec, but are caused by content that may be parsed unambiguously.
To ignore these errors, use the `strict: false` option:

- Comments must be separated from other tokens by white space characters (only when preceding node is known to have ended)
- Implicit keys of flow sequence pairs need to be on a single line
- The : indicator must be at most 1024 chars after the start of an implicit block mapping key

For additional control, set the `logLevel` option to `'error'` (default: `'warn'`) to silence all warnings.
Setting `logLevel: 'silent'` will ignore parsing errors completely, resulting in output that may well be rather broken.
