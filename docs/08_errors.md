# Errors

Nearly all errors and warnings produced by the `yaml` parser functions contain the following fields:

| Member  | Type     | Description                                                              |
| ------- | -------- | ------------------------------------------------------------------------ |
| name    | `string` | Either `YAMLParseError` or `YAMLWarning`                                 |
| message | `string` | A human-readable description of the error                                |
| offset  | `number` | The offset in the source at which this error or warning was encountered. |

If the `prettyErrors` option is enabled, the following fields are added with summary information regarding the error's source node, if available:

| Member   | Type                                | Description                                                                                   |
| -------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| nodeType | `string`                            | A string constant identifying the type of node                                                |
| range    | `{ start: number, end: ?number }`   | Character offset in the input string                                                          |
| linePos  | `{ start: LinePos, end: ?LinePos }` | One-indexed human-friendly source location. `LinePos` here is `{ line: number, col: number }` |

In rare cases, the library may produce a more generic error. In particular, `TypeError` may occur when parsing invalid input using the `json` schema, and `ReferenceError` when the `maxAliasCount` limit is enountered.

## YAMLParseError

An error encountered while parsing a source as YAML.

## YAMLWarning

Not an error, but a spec-mandated warning about unsupported directives or a fallback resolution being used for a node with an unavailable tag. Not used by the CST parser.
