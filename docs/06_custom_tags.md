# Custom Data Types

```js
import { parse, parseDocument } from 'yaml'

parse('2001-12-15 2:59:43')
// '2001-12-15 2:59:43'

parse('!!timestamp 2001-12-15 2:59:43')
// 2001-12-15T02:59:43.000Z (Date instance)

const doc = parseDocument('2001-12-15 2:59:43', { customTags: ['timestamp'] })
doc.contents.value.toDateString()
// 'Sat Dec 15 2001'
```

The easiest way to extend a [schema](#data-schemas) is by defining the additional **tags** that you wish to support. To do that, the `customTags` option allows you to provide an array of custom tag objects or tag identifiers. In particular, the built-in tags that are a part of the `core` and `yaml-1.1` schemas may be referred to by their string identifiers. For those tags that are available in both, only the `core` variant is provided as a custom tag.

For further customisation, `customTags` may also be a function `(Tag[]) => (Tag[])` that may modify the schema's base tag array.

## Built-in Custom Tags

```js
parse('[ one, true, 42 ]')
// [ 'one', true, 42 ]

parse('[ one, true, 42 ]', { schema: 'failsafe' })
// [ 'one', 'true', '42' ]

parse('[ one, true, 42 ]', { schema: 'failsafe', customTags: ['int'] })
// [ 'one', 'true', 42 ]
```

### YAML 1.2 Core Schema

These tags are a part of the YAML 1.2 [Core Schema](https://yaml.org/spec/1.2/spec.html#id2804923), and may be useful when constructing a parser or stringifier for a more limited set of types, based on the `failsafe` schema. Some of these define a `format` value; this will be added to the parsed nodes and affects the node's stringification.

If including more than one custom tag from this set, make sure that the `'float'` and `'int'` tags precede any of the other `!!float` and `!!int` tags.

| Identifier   | Regular expression                               | YAML Type | Format  | Example values  |
| ------------ | ------------------------------------------------ | --------- | ------- | --------------- |
| `'bool'`     | `true⎮True⎮TRUE⎮false⎮False⎮FALSE`               | `!!bool`  |         | `true`, `false` |
| `'float'`    | `[-+]?(0⎮[1-9][0-9]*)\.[0-9]*`                   | `!!float` |         | `4.2`, `-0.0`   |
| `'floatExp'` | `[-+]?(0⎮[1-9][0-9]*)(\.[0-9]*)?[eE][-+]?[0-9]+` | `!!float` | `'EXP'` | `4.2e9`         |
| `'floatNaN'` | `[-+]?(\.inf⎮\.Inf⎮\.INF)⎮\.nan⎮\.NaN⎮\.NAN`     | `!!float` |         | `-Infinity`     |
| `'int'`      | `[-+]?[0-9]+`                                    | `!!int`   |         | `42`, `-0`      |
| `'intHex'`   | `0x[0-9a-fA-F]+`                                 | `!!int`   | `'HEX'` | `0xff0033`      |
| `'intOct'`   | `0o[0-7]+`                                       | `!!int`   | `'OCT'` | `0o127`         |
| `'null'`     | `~⎮null⎮Null⎮NULL`                               | `!!null`  |         | `null`          |

### YAML 1.1

These tags are a part of the YAML 1.1 [language-independent types](https://yaml.org/type/), but are not a part of any default YAML 1.2 schema.

| Identifier    | YAML Type                                             | JS Type      | Description                                                                                                                                                                       |
| ------------- | ----------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'binary'`    | [`!!binary`](https://yaml.org/type/binary.html)       | `Uint8Array` | Binary data, represented in YAML as base64 encoded characters.                                                                                                                    |
| `'floatTime'` | [`!!float`](https://yaml.org/type/float.html)         | `Number`     | Sexagesimal floating-point number format, e.g. `190:20:30.15`. To stringify with this tag, the node `format` must be `'TIME'`.                                                    |
| `'intTime'`   | [`!!int`](https://yaml.org/type/int.html)             | `Number`     | Sexagesimal integer number format, e.g. `190:20:30`. To stringify with this tag, the node `format` must be `'TIME'`.                                                              |
| `'omap'`      | [`!!omap`](https://yaml.org/type/omap.html)           | `Map`        | Ordered sequence of key: value pairs without duplicates. Using `mapAsMap: true` together with this tag is not recommended, as it makes the parse → stringify loop non-idempotent. |
| `'pairs'`     | [`!!pairs`](https://yaml.org/type/pairs.html)         | `Array`      | Ordered sequence of key: value pairs allowing duplicates. To create from JS, use `doc.createNode(array, { tag: '!!pairs' })`.                                                     |
| `'set'`       | [`!!set`](https://yaml.org/type/set.html)             | `Set`        | Unordered set of non-equal values.                                                                                                                                                |
| `'timestamp'` | [`!!timestamp`](https://yaml.org/type/timestamp.html) | `Date`       | A point in time, e.g. `2001-12-15T02:59:43`.                                                                                                                                      |

## Writing Custom Tags

```js
import { YAMLMap, stringify } from 'yaml'
import { stringifyString } from 'yaml/util'

const regexp = {
  identify: value => value instanceof RegExp,
  tag: '!re',
  resolve(str) {
    const match = str.match(/^\/([\s\S]+)\/([gimuy]*)$/)
    if (!match) throw new Error('Invalid !re value')
    return new RegExp(match[1], match[2])
  }
}

const sharedSymbol = {
  identify: value => value?.constructor === Symbol,
  tag: '!symbol/shared',
  resolve: str => Symbol.for(str),
  stringify(item, ctx, onComment, onChompKeep) {
    const key = Symbol.keyFor(item.value)
    if (key === undefined) throw new Error('Only shared symbols are supported')
    return stringifyString({ value: key }, ctx, onComment, onChompKeep)
  }
}

class YAMLNullObject extends YAMLMap {
  tag = '!nullobject'
  toJSON(_, ctx) {
    const obj = super.toJSON(_, { ...ctx, mapAsMap: false }, Object)
    return Object.assign(Object.create(null), obj)
  }
}

const nullObject = {
  tag: '!nullobject',
  collection: 'map',
  nodeClass: YAMLNullObject,
  identify: v => !!(typeof v === 'object' && v && !Object.getPrototypeOf(v))
}

// slightly more complicated object type
class YAMLError extends YAMLMap {
  tag = '!error'
  toJSON(_, ctx) {
    const { name, message, stack, ...rest } = super.toJSON(
      _,
      { ...ctx, mapAsMap: false },
      Object
    )
    // craft the appropriate error type
    const Cls =
      name === 'EvalError'
        ? EvalError
        : name === 'RangeError'
        ? RangeError
        : name === 'ReferenceError'
        ? ReferenceError
        : name === 'SyntaxError'
        ? SyntaxError
        : name === 'TypeError'
        ? TypeError
        : name === 'URIError'
        ? URIError
        : Error
    if (Cls.name !== name) {
      Object.defineProperty(er, 'name', {
        value: name,
        enumerable: false,
        configurable: true
      })
    }
    Object.defineProperty(er, 'stack', {
      value: stack,
      enumerable: false,
      configurable: true
    })
    return Object.assign(er, rest)
  }

  static from(schema, obj, ctx) {
    const { name, message, stack } = obj
    // ensure these props remain, even if not enumerable
    return super.from(schema, { ...obj, name, message, stack }, ctx)
  }
}

const error = {
  tag: '!error',
  collection: 'map',
  nodeClass: YAMLError,
  identify: v => !!(typeof v === 'object' && v && v instanceof Error)
}

stringify(
  {
    regexp: /foo/gi,
    symbol: Symbol.for('bar'),
    nullobj: Object.assign(Object.create(null), { a: 1, b: 2 }),
    error: new Error('This was an error')
  },
  { customTags: [regexp, sharedSymbol, nullObject, error] }
)
// regexp: !re /foo/gi
// symbol: !symbol/shared bar
// nullobj: !nullobject
//   a: 1
//   b: 2
// error: !error
//   name: Error
//   message: 'This was an error'
//   stack: |
//     at some-file.js:1:3
```

In YAML-speak, a custom data type is represented by a _tag_. To define your own tag, you need to account for the ways that your data is both parsed and stringified. Furthermore, both of those processes are split into two stages by the intermediate AST node structure.

If you wish to implement your own custom tags, the [`!!binary`](https://github.com/eemeli/yaml/blob/main/src/schema/yaml-1.1/binary.ts) and [`!!set`](https://github.com/eemeli/yaml/blob/main/src/schema/yaml-1.1/set.ts) tags provide relatively cohesive examples to study in addition to the simple examples in the sidebar here.

Custom collection types (ie, Maps, Sets, objects, and arrays; anything with child properties that may not be propertly serialized to a scalar value) may provide a `nodeClass` property that extends the [`YAMLMap`](https://github.com/eemeli/yaml/blob/main/src/nodes/YAMLMap.ts) and [`YAMLSeq`](https://github.com/eemeli/yaml/blob/main/src/nodes/YAMLSeq.ts) classes, which will be used for parsing and stringifying objects with the specified tag.

### Parsing Custom Data

At the lowest level, the [`Lexer`](#lexer) and [`Parser`](#parser) will take care of turning string input into a concrete syntax tree (CST).
In the CST all scalar values are available as strings, and maps & sequences as collections of nodes.
Each schema includes a set of default data types, which handle converting at least strings, maps and sequences into their AST nodes.
These are considered to have _implicit_ tags, and are autodetected.
Custom tags, on the other hand, should almost always define an _explicit_ `tag` with which their value will be prefixed.
This may be application-specific local `!tag`, a shorthand `!ns!tag`, or a verbatim `!<tag:example.com,2019:tag>`.

Once identified by matching the `tag`, the `resolve(value, onError): Node | any` function will turn a parsed value into an AST node.
`value` may be either a `string`, a `YAMLMap` or a `YAMLSeq`, depending on the node's shape.
A custom tag should verify that value is of its expected type.

Note that during the CST -> AST composition, the anchors and comments attached to each node are also resolved for each node.
This metadata will unfortunately be lost when converting the values to JS objects, so collections should have values that extend one of the existing collection classes.
Collections should therefore either fall back to their parent classes' `toJSON()` methods, or define their own in order to allow their contents to be expressed as the appropriate JS object.

### Creating Nodes and Stringifying Custom Data

As with parsing, turning input data into its YAML string representation is a two-stage process as the input is first turned into an AST tree before stringifying it.
This allows for metadata and comments to be attached to each node, and for e.g. circular references to be resolved.
For scalar values, this means just wrapping the value within a `Scalar` class while keeping it unchanged.

As values may be wrapped within objects and arrays, `doc.createNode()` uses each tag's `identify(value): boolean` function to detect custom data types.
For the same reason, collections need to define their own `createNode(schema, value, ctx): Collection` functions that may recursively construct their equivalent collection class instances.

Finally, `stringify(item, ctx, ...): string` defines how your data should be represented as a YAML string, in case the default stringifiers aren't enough.
For collections in particular, the default stringifier should be perfectly sufficient.
`'yaml/util'` exports `stringifyNumber(item)` and `stringifyString(item, ctx, ...)`, which may be of use for custom scalar data.

### Custom Tag API

```js
import {
  createNode, // (value, tagName, ctx) => Node -- Create a new node
  createPair, // (key, value, ctx) => Pair -- Create a new pair
  debug, // (logLevel, ...messages) => void -- Log debug messages to console
  findPair, // (items, key) => Pair? -- Given a key, find a matching Pair
  foldFlowLines, // (text, indent, mode, options) => string -- Fold long lines
  mapTag, // CollectionTag
  seqTag, // CollectionTag
  stringTag, // ScalarTag
  stringifyNumber, // (node) => string
  stringifyString, // (node, ctx, ...) => string
  toJS, // (value, arg, ctx) => any -- Recursively convert to plain JS
  warn // (logLevel, warning) => void -- Emit a warning
} from 'yaml/util'
```

To define your own tag, you'll need to define an object comprising of some of the following fields. Those in bold are required:

- `createNode(schema, value, ctx): Node` is an optional factory function, used e.g. by collections when wrapping JS objects as AST nodes.
- `format: string` If a tag has multiple forms that should be parsed and/or stringified differently, use `format` to identify them. Used by `!!int` and `!!float`.
- **`identify(value): boolean`** is used by `doc.createNode()` to detect your data type, e.g. using `typeof` or `instanceof`. Required.
- `nodeClass: Node` is the `Node` child class that implements this tag. Required for collections and tags that have overlapping JS representations.
- **`resolve(value, onError): Node | any`** turns a parsed value into an AST node; `value` is either a `string`, a `YAMLMap` or a `YAMLSeq`. `onError(msg)` should be called with an error message string when encountering errors, as it'll allow you to still return some value for the node. If returning a non-`Node` value, the output will be wrapped as a `Scalar`. Required.
- `stringify(item, ctx, onComment, onChompKeep): string` is an optional function stringifying the `item` AST node in the current context `ctx`. `onComment` and `onChompKeep` are callback functions for a couple of special cases. If your data includes a suitable `.toString()` method, you can probably leave this undefined and use the default stringifier.
- **`tag: string`** is the identifier for your data type, with which its stringified form will be prefixed. Should either be a !-prefixed local `!tag`, or a fully qualified `tag:domain,date:foo`. Required.
- `test: RegExp` and `default: boolean` allow for values to be stringified without an explicit tag and detected using a regular expression. For most cases, it's unlikely that you'll actually want to use these, even if you first think you do.
