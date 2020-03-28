# Errors

Nearly all errors and warnings produced by the `yaml` parser functions contain the following fields:

| Member  | Type       | Description                                                                                                                                                                     |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name    | `string`   | One of `YAMLReferenceError`, `YAMLSemanticError`, `YAMLSyntaxError`, or `YAMLWarning`                                                                                           |
| message | `string`   | A human-readable description of the error                                                                                                                                       |
| source  | `CST Node` | The CST node at which this error or warning was encountered. Note that in particular `source.context` is likely to be a complex object and include some circular references. |

If the `prettyErrors` option is enabled, `source` is dropped from the errors and the following fields are added with summary information regarding the error's source node, if available:

| Member   | Type                                | Description                                                                                   |
| -------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| nodeType | `string`                            | A string constant identifying the type of node                                                |
| range    | `{ start: number, end: ?number }`   | Character offset in the input string                                                          |
| linePos  | `{ start: LinePos, end: ?LinePos }` | One-indexed human-friendly source location. `LinePos` here is `{ line: number, col: number }` |

In rare cases, the library may produce a more generic error. In particular, `TypeError` may occur when parsing invalid input using the `json` schema, and `ReferenceError` when the `maxAliasCount` limit is enountered.

## YAMLReferenceError

An error resolving a tag or an anchor that is referred to in the source. It is likely that the contents of the `source` node have not been completely parsed into the document. Not used by the CST parser.

## YAMLSemanticError

An error related to the metadata of the document, or an error with limitations imposed by the YAML spec. The data contents of the document should be valid, but the metadata may be broken.

## YAMLSyntaxError

A serious parsing error; the document contents will not be complete, and the CST is likely to be rather broken.

## YAMLWarning

Not an error, but a spec-mandated warning about unsupported directives or a fallback resolution being used for a node with an unavailable tag. Not used by the CST parser.
