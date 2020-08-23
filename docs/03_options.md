# Options

```js
YAML.defaultOptions
// { keepBlobsInJSON: true,
//   keepNodeTypes: true,
//   version: '1.2' }

YAML.Document.defaults
// { '1.0': { merge: true, schema: 'yaml-1.1' },
//   '1.1': { merge: true, schema: 'yaml-1.1' },
//   '1.2': { merge: false, schema: 'core' } }
```

#### `YAML.defaultOptions`

#### `YAML.Document.defaults`

`yaml` defines document-specific options in three places: as an argument of parse, create and stringify calls, in the values of `YAML.defaultOptions`, and in the version-dependent `YAML.Document.defaults` object. Values set in `YAML.defaultOptions` override version-dependent defaults, and argument options override both.

The `version` option value (`'1.2'` by default) may be overridden by any document-specific `%YAML` directive.

| Option           | Type                                          | Description                                                                                                                                                             |
| ---------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| anchorPrefix     | `string`                                      | Default prefix for anchors. By default `'a'`, resulting in anchors `a1`, `a2`, etc.                                                                                     |
| customTags       | `Tag[] ⎮ function`                            | Array of [additional tags](#custom-data-types) to include in the schema                                                                                                 |
| indent           | `number`                                      | The number of spaces to use when indenting code. By default `2`.                                                                                                        |
| indentSeq        | `boolean`                                     | Whether block sequences should be indented. By default `true`.                                                                                                          |
| keepBlobsInJSON  | `boolean`                                     | Allow non-JSON JavaScript objects to remain in the `toJSON` output. Relevant with the YAML 1.1 `!!timestamp` and `!!binary` tags as well as BigInts. By default `true`. |
| keepCstNodes     | `boolean`                                     | Include references in the AST to each node's corresponding CST node. By default `false`.                                                                                |
| keepNodeTypes    | `boolean`                                     | Store the original node type when parsing documents. By default `true`.                                                                                                 |
| mapAsMap         | `boolean`                                     | When outputting JS, use Map rather than Object to represent mappings. By default `false`.                                                                               |
| maxAliasCount    | `number`                                      | Prevent [exponential entity expansion attacks] by limiting data aliasing count; set to `-1` to disable checks; `0` disallows all alias nodes. By default `100`.         |
| merge            | `boolean`                                     | Enable support for `<<` merge keys. By default `false` for YAML 1.2 and `true` for earlier versions.                                                                    |
| prettyErrors     | `boolean`                                     | Include line position & node type directly in errors; drop their verbose source and context. By default `false`.                                                        |
| resolveKnownTags | `boolean`                                     | When using the `'core'` schema, support parsing values with these explicit [YAML 1.1 tags]: `!!binary`, `!!omap`, `!!pairs`, `!!set`, `!!timestamp`. By default `true`. |
| schema           | `'core' ⎮ 'failsafe' ⎮` `'json' ⎮ 'yaml-1.1'` | The base schema to use. By default `'core'` for YAML 1.2 and `'yaml-1.1'` for earlier versions.                                                                         |
| simpleKeys       | `boolean`                                     | When stringifying, require keys to be scalars and to use implicit rather than explicit notation. By default `false`.                                                    |
| sortMapEntries   | `boolean ⎮` `(a, b: Pair) => number`          | When stringifying, sort map entries. If `true`, sort by comparing key values with `<`. By default `false`.                                                              |
| version          | `'1.0' ⎮ '1.1' ⎮ '1.2'`                       | The YAML version used by documents without a `%YAML` directive. By default `'1.2'`.                                                                                     |

[exponential entity expansion attacks]: https://en.wikipedia.org/wiki/Billion_laughs_attack
[yaml 1.1 tags]: https://yaml.org/type/

## Data Schemas

```js
YAML.parse('3') // 3
YAML.parse('3', { schema: 'failsafe' }) // '3'

YAML.parse('No') // 'No'
YAML.parse('No', { schema: 'json' }) // SyntaxError: Unresolved plain scalar "No"
YAML.parse('No', { schema: 'yaml-1.1' }) // false
YAML.parse('No', { version: '1.1' }) // false

YAML.parse('{[1, 2]: many}') // { '[1,2]': 'many' }
YAML.parse('{[1, 2]: many}', { mapAsMap: true }) // Map { [ 1, 2 ] => 'many' }
```

Aside from defining the language structure, the YAML 1.2 spec defines a number of different _schemas_ that may be used. The default is the [`core`](http://yaml.org/spec/1.2/spec.html#id2804923) schema, which is the most common one. The [`json`](http://yaml.org/spec/1.2/spec.html#id2803231) schema is effectively the minimum schema required to parse JSON; both it and the core schema are supersets of the minimal [`failsafe`](http://yaml.org/spec/1.2/spec.html#id2802346) schema.

The `yaml-1.1` schema matches the more liberal [YAML 1.1 types](http://yaml.org/type/) (also used by YAML 1.0), including binary data and timestamps as distinct tags as well as accepting greater variance in scalar values (with e.g. `'No'` being parsed as `false` rather than a string value). The `!!value` and `!!yaml` types are not supported.

```js
YAML.defaultOptions.merge = true

const mergeResult = YAML.parse(`
source: &base { a: 1, b: 2 }
target:
  <<: *base
  b: base
`)

mergeResult.target
// { a: 1, b: 'base' }
```

**Merge** keys are a [YAML 1.1 feature](http://yaml.org/type/merge.html) that is not a part of the 1.2 spec. To use a merge key, assign an alias node or an array of alias nodes as the value of a `<<` key in a mapping.

## Scalar Options

```js
// Without simpleKeys, an all-null-values object uses explicit keys & no values
YAML.stringify({ 'this is': null }, { simpleKeys: true })
// this is: null

YAML.scalarOptions.null.nullStr = '~'
YAML.scalarOptions.str.defaultType = 'QUOTE_SINGLE'
YAML.stringify({ this: null, that: 'value' })
// this: ~
// that: 'value'
```

#### `YAML.scalarOptions`

Some customization options are availabe to control the parsing and stringification of scalars. Note that these values are used by all documents.

These options objects are also exported individually from `'yaml/types'`.

| Option             | Type      | Default value                                       | Description                                                                                                                                                                |
| ------------------ | --------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| binary.defaultType | `Type`    | `'BLOCK_LITERAL'`                                   | The type of string literal used to stringify `!!binary` values                                                                                                             |
| binary.lineWidth   | `number`  | `76`                                                | Maximum line width for `!!binary` values                                                                                                                                   |
| bool.trueStr       | `string`  | `'true'`                                            | String representation for `true` values                                                                                                                                    |
| bool.falseStr      | `string`  | `'false'`                                           | String representation for `false` values                                                                                                                                   |
| int.asBigInt       | `boolean` | `false`                                             | Whether integers should be parsed into [BigInt] values                                                                                                                     |
| null.nullStr       | `string`  | `'null'`                                            | String representation for `null` values                                                                                                                                    |
| str.defaultType    | `Type`    | `'PLAIN'`                                           | The default type of string literal used to stringify values in general                                                                                                     |
| str.defaultKeyType | `Type`    | `'PLAIN'`                                           | The default type of string literal used to stringify implicit key values                                                                                                   |
| str.doubleQuoted   | `object`  | `{ jsonEncoding: false,` `minMultiLineLength: 40 }` | `jsonEncoding`: Whether to restrict double-quoted strings to use JSON-compatible syntax; `minMultiLineLength`: Minimum length to use multiple lines to represent the value |
| str.fold           | `object`  | `{ lineWidth: 80,` `minContentWidth: 20 }`          | `lineWidth`: Maximum line width (set to `0` to disable folding); `minContentWidth`: Minimum width for highly-indented content                                              |

[bigint]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/BigInt

## Silencing Warnings

By default, the library will emit warnings as required by the YAML spec during parsing. If you'd like to silence these, define a global or `process.env` variable `YAML_SILENCE_WARNINGS` with a true-ish value.
