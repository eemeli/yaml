# Options

```js
YAML.defaultOptions
// { anchorPrefix: 'a',
//   keepUndefined: false,
//   logLevel: 'warn',
//   prettyErrors: true,
//   strict: true,
//   version: '1.2' }
```

In addition to the `options` arguments of functions, the values of `YAML.defaultOptions` are used as default values.

Parse options affect the parsing and composition of a YAML Document from it source.

| Parse Option | Type          | Description                                                                                                                             |
| ------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| intAsBigInt  | `boolean`     | Whether integers should be parsed into [BigInt] rather than `number` values. By default `false`.                                        |
| lineCounter  | `LineCounter` | If set, newlines will be tracked, to allow for `lineCounter.linePos(offset)` to provide the `{ line, col }` positions within the input. |
| prettyErrors | `boolean`     | Include line position & node type directly in errors. By default `false`.                                                               |
| strict       | `boolean`     | When parsing, do not ignore errors required by the YAML 1.2 spec, but caused by unambiguous content. By default `true`.                 |

[bigint]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/BigInt

Document options are relevant for operations on the `Document` object.

| Document Option | Type                          | Description                                                                                                                                        |
| --------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| anchorPrefix    | `string`                      | Default prefix for anchors. By default `'a'`, resulting in anchors `a1`, `a2`, etc.                                                                |
| keepUndefined   | `boolean`                     | Keep `undefined` object values when creating mappings and return a Scalar node when stringifying `undefined`. By default `false`.                  |
| logLevel        | `'warn' ⎮ 'error' ⎮ 'silent'` | Control the verbosity of `YAML.parse()`. Set to `'error'` to silence warnings, and to `'silent'` to also silence most errors. By default `'warn'`. |
| version         | `'1.1' ⎮ '1.2'`               | The YAML version used by documents without a `%YAML` directive. By default `'1.2'`.                                                                |

Schema options determine the types of values that the document is expected and able to support.

| Schema Option    | Type                                          | Description                                                                                                                                                             |
| ---------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| customTags       | `Tag[] ⎮ function`                            | Array of [additional tags](#custom-data-types) to include in the schema                                                                                                 |
| merge            | `boolean`                                     | Enable support for `<<` merge keys. By default `false` for YAML 1.2 and `true` for earlier versions.                                                                    |
| resolveKnownTags | `boolean`                                     | When using the `'core'` schema, support parsing values with these explicit [YAML 1.1 tags]: `!!binary`, `!!omap`, `!!pairs`, `!!set`, `!!timestamp`. By default `true`. |
| schema           | `'core' ⎮ 'failsafe' ⎮` `'json' ⎮ 'yaml-1.1'` | The base schema to use. By default `'core'` for YAML 1.2 and `'yaml-1.1'` for earlier versions.                                                                         |
| sortMapEntries   | `boolean ⎮` `(a, b: Pair) => number`          | When stringifying, sort map entries. If `true`, sort by comparing key values with `<`. By default `false`.                                                              |

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

YAML.scalarOptions.str.defaultType = 'QUOTE_SINGLE'
YAML.stringify({ this: null, that: 'value' }, { nullStr: '~' })
// this: ~
// that: 'value'
```

#### `YAML.scalarOptions`

Some customization options are availabe to control the parsing and stringification of scalars. Note that these values are used by all documents.

| Option             | Type     | Default value                                       | Description                                                                                                                                                                |
| ------------------ | -------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| binary.defaultType | `Type`   | `'BLOCK_LITERAL'`                                   | The type of string literal used to stringify `!!binary` values                                                                                                             |
| binary.lineWidth   | `number` | `76`                                                | Maximum line width for `!!binary` values                                                                                                                                   |
| str.defaultType    | `Type`   | `'PLAIN'`                                           | The default type of string literal used to stringify values in general                                                                                                     |
| str.defaultKeyType | `Type`   | `'PLAIN'`                                           | The default type of string literal used to stringify implicit key values                                                                                                   |
| str.doubleQuoted   | `object` | `{ jsonEncoding: false,` `minMultiLineLength: 40 }` | `jsonEncoding`: Whether to restrict double-quoted strings to use JSON-compatible syntax; `minMultiLineLength`: Minimum length to use multiple lines to represent the value |
| str.fold           | `object` | `{ lineWidth: 80,` `minContentWidth: 20 }`          | `lineWidth`: Maximum line width (set to `0` to disable folding); `minContentWidth`: Minimum width for highly-indented content                                              |

## Silencing Warnings

By default, the library will emit warnings as required by the YAML spec during parsing.
If you'd like to silence these, set the `logLevel` option to `'error'`.
