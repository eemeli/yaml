# Options

```js
import { parse, stringify } from 'yaml'

parse('number: 999')
// { number: 999 }

parse('number: 999', { intAsBigInt: true })
// { number: 999n }

parse('number: 999', { schema: 'failsafe' })
// { number: '999' }
```

The options supported by various `yaml` features are split into various categories, depending on how and where they are used.
Options in various categories do not overlap, so it's fine to use a single "bag" of options and pass it to each function or method.

## Parse Options

Parse options affect the parsing and composition of a YAML Document from it source.

Used by: `parse()`, `parseDocument()`, `parseAllDocuments()`, `new Composer()`, and `new Document()`

| Name             | Type                          | Default | Description                                                                                                                                                                |
| ---------------- | ----------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| intAsBigInt      | `boolean`                     | `false` | Whether integers should be parsed into [BigInt] rather than `number` values.                                                                                               |
| keepSourceTokens | `boolean`                     | `false` | Include a `srcToken` value on each parsed `Node`, containing the [CST token](#working-with-cst-tokens) that was composed into this node.                                   |
| lineCounter      | `LineCounter`                 |         | If set, newlines will be tracked, to allow for `lineCounter.linePos(offset)` to provide the `{ line, col }` positions within the input.                                    |
| prettyErrors     | `boolean`                     | `true`  | Include line/col position in errors, along with an extract of the source string.                                                                                           |
| strict           | `boolean`                     | `true`  | When parsing, do not ignore errors [required](#silencing-errors-and-warnings) by the YAML 1.2 spec, but caused by unambiguous content.                                     |
| uniqueKeys       | `boolean ⎮ (a, b) => boolean` | `true`  | Whether key uniqueness is checked, or customised. If set to be a function, it will be passed two parsed nodes and should return a boolean value indicating their equality. |

[bigint]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/BigInt

## Document Options

Document options are relevant for operations on the `Document` object, which makes them relevant for both conversion directions.

Used by: `parse()`, `parseDocument()`, `parseAllDocuments()`, `stringify()`, `new Composer()`, and `new Document()`

| Name     | Type                            | Default  | Description                                                                                                                                |
| -------- | ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| logLevel | `'warn' ⎮ 'error' ⎮` `'silent'` | `'warn'` | Control the verbosity of `parse()`. Set to `'error'` to silence warnings, and to `'silent'` to also silence most errors (not recommended). |
| version  | `'1.1' ⎮ '1.2'`                 | `'1.2'`  | The YAML version used by documents without a `%YAML` directive.                                                                            |

By default, the library will emit warnings as required by the YAML spec during parsing.
If you'd like to silence these, set the `logLevel` option to `'error'`.

## Schema Options

```js
parse('3') // 3 (Using YAML 1.2 core schema by default)
parse('3', { schema: 'failsafe' }) // '3'

parse('No') // 'No'
parse('No', { schema: 'json' }) // SyntaxError: Unresolved plain scalar "No"
parse('No', { schema: 'yaml-1.1' }) // false
parse('No', { version: '1.1' }) // false
```

Schema options determine the types of values that the document supports.

Aside from defining the language structure, the YAML 1.2 spec defines a number of different _schemas_ that may be used.
The default is the [`core`](http://yaml.org/spec/1.2/spec.html#id2804923) schema, which is the most common one.
The [`json`](http://yaml.org/spec/1.2/spec.html#id2803231) schema is effectively the minimum schema required to parse JSON; both it and the core schema are supersets of the minimal [`failsafe`](http://yaml.org/spec/1.2/spec.html#id2802346) schema.

The `yaml-1.1` schema matches the more liberal [YAML 1.1 types](http://yaml.org/type/) (also used by YAML 1.0), including binary data and timestamps as distinct tags.
This schema accepts a greater variance in scalar values (with e.g. `'No'` being parsed as `false` rather than a string value).
The `!!value` and `!!yaml` types are not supported.

Used by: `parse()`, `parseDocument()`, `parseAllDocuments()`, `stringify()`, `new Composer()`, `new Document()`, and `doc.setSchema()`

| Name             | Type                                 | Default                                   | Description                                                                                                                                                                                                        |
| ---------------- | ------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| compat           | `string ⎮ Tag[] ⎮ null`              | `null`                                    | When parsing, warn about compatibility issues with the given schema. When stringifying, use scalar styles that are parsed correctly by the `compat` schema as well as the actual schema.                           |
| customTags       | `Tag[] ⎮ function`                   |                                           | Array of [additional tags](#custom-data-types) to include in the schema                                                                                                                                            |
| merge            | `boolean`                            | 1.1:&nbsp;`true` 1.2:&nbsp;`false`        | Enable support for `<<` merge keys. Default value depends on YAML version.                                                                                                                                         |
| resolveKnownTags | `boolean`                            | `true`                                    | When using the `'core'` schema, support parsing values with these explicit [YAML 1.1 tags]: `!!binary`, `!!omap`, `!!pairs`, `!!set`, `!!timestamp`. By default `true`.                                            |
| schema           | `string`                             | 1.1:&nbsp;`'yaml-1.1'` 1.2:&nbsp;`'core'` | The base schema to use. Default value depends on YAML version. Built-in support is provided for `'core'`, `'failsafe'`, `'json'`, and `'yaml-1.1'`. If using another value, `customTags` must be an array of tags. |
| sortMapEntries   | `boolean ⎮` `(a, b: Pair) => number` | `false`                                   | When stringifying, sort map entries. If `true`, sort by comparing key values using the native less-than `<` operator.                                                                                              |
| toStringDefaults | `ToStringOptions`                    |                                           | Override default values for `toString()` options.                                                                                                                                                                  |

[yaml 1.1 tags]: https://yaml.org/type/

```js
const src = `
  source: &base { a: 1, b: 2 }
  target:
    <<: *base
    b: base`
const mergeResult = parse(src, { merge: true })
mergeResult.target
// { a: 1, b: 'base' }
```

**Merge** keys are a [YAML 1.1 feature](http://yaml.org/type/merge.html) that is not a part of the 1.2 spec.
To use a merge key, assign a map or its alias or an array of such as the value of a `<<` key in a mapping.
Multiple merge keys may be used on the same map, with earlier values taking precedence over latter ones, in case both define a value for the same key.

## CreateNode Options

Used by: `stringify()`, `new Document()`, `doc.createNode()`, and `doc.createPair()`

| Name                  | Type      | Default | Description                                                                                                                                      |
| --------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| aliasDuplicateObjects | `boolean` | `true`  | During node construction, use anchors and aliases to keep strictly equal non-null objects as equivalent in YAML.                                 |
| anchorPrefix          | `string`  | `'a'`   | Default prefix for anchors, resulting in anchors `a1`, `a2`, ... by default.                                                                     |
| flow                  | `boolean` | `false` | Force the top-level collection node to use flow style.                                                                                           |
| keepUndefined         | `boolean` | `false` | Keep `undefined` object values when creating mappings and return a Scalar node when stringifying `undefined`.                                    |
| tag                   | `string`  |         | Specify the top-level collection type, e.g. `'!!omap'`. Note that this requires the corresponding tag to be available in this document's schema. |

## ToJS Options

```js
parse('{[1, 2]: many}') // { '[ 1, 2 ]': 'many' }
parse('{[1, 2]: many}', { mapAsMap: true }) // Map { [ 1, 2 ] => 'many' }
```

These options influence how the document is transformed into "native" JavaScript representation.

Used by: `parse()`, `doc.toJS()` and `node.toJS()`

| Name          | Type                                  | Default | Description                                                                                                                                         |
| ------------- | ------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| mapAsMap      | `boolean`                             | `false` | Use Map rather than Object to represent mappings.                                                                                                   |
| maxAliasCount | `number`                              | `100`   | Prevent [exponential entity expansion attacks] by limiting data aliasing; set to `-1` to disable checks; `0` disallows all alias nodes.             |
| onAnchor      | `(value: any, count: number) => void` |         | Optional callback for each aliased anchor in the document.                                                                                          |
| reviver       | `(key: any, value: any) => any`       |         | Optionally apply a [reviver function] to the output, following the JSON specification but with appropriate extensions for handling `Map` and `Set`. |

[exponential entity expansion attacks]: https://en.wikipedia.org/wiki/Billion_laughs_attack
[reviver function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Using_the_reviver_parameter

## ToString Options

```js
stringify(
  { this: null, that: 'value' },
  { defaultStringType: 'QUOTE_SINGLE', nullStr: '~' }
)
// 'this': ~
// 'that': 'value'
```

The `doc.toString()` method may be called with additional options to control the resulting YAML string representation of the document.

Used by: `stringify()` and `doc.toString()`

| Name                           | Type                                                                                      | Default   | Description                                                                                                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| blockQuote                     | `boolean ⎮ 'folded' ⎮ 'literal'`                                                          | `true`    | Use block quote styles for scalar values where applicable. Set to `false` to disable block quotes completely.                                                                                                                 |
| collectionStyle                | `'any' ⎮ 'block' ⎮ 'flow'`                                                                | `'any'`   | Enforce `'block'` or `'flow'` style on maps and sequences. By default, allows each collection to set its own `flow: boolean` property.                                                                                        |
| commentString                  | `(comment: string) => string`                                                             |           | Output should be valid for the current schema. By default, empty comment lines are left empty, lines consisting of a single space are replaced by `#`, and all other lines are prefixed with a `#`.                           |
| defaultKeyType                 | `'BLOCK_FOLDED' ⎮ 'BLOCK_LITERAL' ⎮` `'QUOTE_DOUBLE' ⎮ 'QUOTE_SINGLE' ⎮` `'PLAIN' ⎮ null` | `null`    | If not `null`, overrides `defaultStringType` for implicit key values.                                                                                                                                                         |
| defaultStringType              | `'BLOCK_FOLDED' ⎮ 'BLOCK_LITERAL' ⎮` `'QUOTE_DOUBLE' ⎮ 'QUOTE_SINGLE' ⎮` `'PLAIN'`        | `'PLAIN'` | The default type of string literal used to stringify values.                                                                                                                                                                  |
| directives                     | `boolean ⎮ null`                                                                          | `null`    | Include directives in the output. If `true`, at least the document-start marker `---` is always included. If `false`, no directives or marker is ever included. If `null`, directives and marker may be included if required. |
| doubleQuotedAsJSON             | `boolean`                                                                                 | `false`   | Restrict double-quoted strings to use JSON-compatible syntax.                                                                                                                                                                 |
| doubleQuotedMinMultiLineLength | `number`                                                                                  | `40`      | Minimum length for double-quoted strings to use multiple lines to represent the value.                                                                                                                                        |
| falseStr                       | `string`                                                                                  | `'false'` | String representation for `false` values.                                                                                                                                                                                     |
| flowCollectionPadding          | `boolean`                                                                                 | `true`    | When true, a single space of padding will be added inside the delimiters of non-empty single-line flow collections.                                                                                                           |
| indent                         | `number`                                                                                  | `2`       | The number of spaces to use when indenting code. Should be a strictly positive integer.                                                                                                                                       |
| indentSeq                      | `boolean`                                                                                 | `true`    | Whether block sequences should be indented.                                                                                                                                                                                   |
| lineWidth                      | `number`                                                                                  | `80`      | Maximum line width (set to `0` to disable folding). This is a soft limit, as only double-quoted semantics allow for inserting a line break in the middle of a word.                                                           |
| minContentWidth                | `number`                                                                                  | `20`      | Minimum line width for highly-indented content (set to `0` to disable).                                                                                                                                                       |
| nullStr                        | `string`                                                                                  | `'null'`  | String representation for `null` values.                                                                                                                                                                                      |
| simpleKeys                     | `boolean`                                                                                 | `false`   | Require keys to be scalars and always use implicit rather than explicit notation.                                                                                                                                             |
| singleQuote                    | `boolean ⎮ null`                                                                          | `null`    | Use 'single quote' rather than "double quote" where applicable. Set to `false` to disable single quotes completely.                                                                                                           |
| trueStr                        | `string`                                                                                  | `'true'`  | String representation for `true` values.                                                                                                                                                                                      |
