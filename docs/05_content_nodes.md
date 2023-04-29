# Content Nodes

After parsing, the `contents` value of each `YAML.Document` is the root of an [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) of nodes representing the document (or `null` for an empty document).

Both scalar and collection values may have an `anchor` associated with them; this is rendered in the string representation with a `&` prefix, so e.g. in `foo: &aa bar`, the value `bar` has the anchor `aa`.
Anchors are used by [Alias nodes](#alias-nodes) to allow for the same value to be used in multiple places in the document.
It is valid to have an anchor associated with a node even if it has no aliases.

## Scalar Values

```js
class NodeBase {
  comment?: string        // a comment on or immediately after this
  commentBefore?: string  // a comment before this
  range?: [number, number, number]
      // The `[start, value-end, node-end]` character offsets for the part
      // of the source parsed into this node (undefined if not parsed).
      // The `value-end` and `node-end` positions are themselves not
      // included in their respective ranges.
  spaceBefore?: boolean
      // a blank line before this node and its commentBefore
  tag?: string       // a fully qualified tag, if required
  clone(): NodeBase  // a copy of this node
  toJS(doc, options?): any // a plain JS representation of this node
  toJSON(): any      // a plain JSON representation of this node
}
```

For scalar values, the `tag` will not be set unless it was explicitly defined in the source document; this also applies for unsupported tags that have been resolved using a fallback tag (string, `YAMLMap`, or `YAMLSeq`).

```js
class Scalar<T = unknown> extends NodeBase {
  anchor?: string  // an anchor associated with this node
  format?: 'BIN' | 'HEX' | 'OCT' | 'TIME' | undefined
      // By default (undefined), numbers use decimal notation.
      // The YAML 1.2 core schema only supports 'HEX' and 'OCT'.
  type?:
    'BLOCK_FOLDED' | 'BLOCK_LITERAL' | 'PLAIN' |
    'QUOTE_DOUBLE' | 'QUOTE_SINGLE' | undefined
  value: T
}
```

A parsed document's contents will have all of its non-object values wrapped in `Scalar` objects, which themselves may be in some hierarchy of `YAMLMap` and `YAMLSeq` collections.
However, this is not a requirement for the document's stringification, which is rather tolerant regarding its input values, and will use [`doc.createNode()`](#creating-nodes) when encountering an unwrapped value.

When stringifying, the node `type` will be taken into account by `!!str` and `!!binary` values, and ignored by other scalars.
On the other hand, `!!int` and `!!float` stringifiers will take `format` into account.

## Collections

```js
class Pair<K = unknown, V = unknown> {
  key: K    // When parsed, key and value are always
  value: V  // Node or null, but can be set to anything
}

class Collection extends NodeBase {
  anchor?: string  // an anchor associated with this node
  flow?: boolean   // use flow style when stringifying this
  schema?: Schema
  addIn(path: Iterable<unknown>, value: unknown): void
  clone(schema?: Schema): NodeBase  // a deep copy of this collection
  deleteIn(path: Iterable<unknown>): boolean
  getIn(path: Iterable<unknown>, keepScalar?: boolean): unknown
  hasIn(path: Iterable<unknown>): boolean
  setIn(path: Iterable<unknown>, value: unknown): void
}

class YAMLMap<K = unknown, V = unknown> extends Collection {
  items: Pair<K, V>[]
  add(pair: Pair<K, V> | { key: K; value: V }, overwrite?: boolean): void
  delete(key: K): boolean
  get(key: K, keepScalar?: boolean): unknown
  has(key: K): boolean
  set(key: K, value: V): void
}

class YAMLSeq<T = unknown> extends Collection {
  items: T[]
  add(value: T): void
  delete(key: number | Scalar<number>): boolean
  get(key: number | Scalar<number>, keepScalar?: boolean): unknown
  has(key: number | Scalar<number>): boolean
  set(key: number | Scalar<number>, value: T): void
}
```

Within all YAML documents, two forms of collections are supported: sequential `YAMLSeq` collections and key-value `YAMLMap` collections.
The JavaScript representations of these collections both have an `items` array, which may (`YAMLSeq`) or must (`YAMLMap`) consist of `Pair` objects that contain a `key` and a `value` of any type, including `null`.
The `items` array of a `YAMLSeq` object may contain values of any type.

When stringifying collections, by default block notation will be used.
Flow notation will be selected if `flow` is `true`, the collection is within a surrounding flow collection, or if the collection is in an implicit key.

The `yaml-1.1` schema includes [additional collections](https://yaml.org/type/index.html) that are based on `YAMLMap` and `YAMLSeq`: `OMap` and `Pairs` are sequences of `Pair` objects (`OMap` requires unique keys & corresponds to the JS Map object), and `Set` is a map of keys with null values that corresponds to the JS Set object.

All of the collections provide the following accessor methods:

| Method                                          | Returns   | Description                                                                                                                                                                                      |
| ----------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| add(value), addIn(path, value)                  | `void`    | Adds a value to the collection. For `!!map` and `!!omap` the value must be a Pair instance or a `{ key, value }` object, which may not have a key that already exists in the map.                |
| delete(key), deleteIn(path)                     | `boolean` | Removes a value from the collection. Returns `true` if the item was found and removed.                                                                                                           |
| get(key,&nbsp;[keep]), getIn(path,&nbsp;[keep]) | `any`     | Returns value at `key`, or `undefined` if not found. By default unwraps scalar values from their surrounding node; to disable set `keep` to `true` (collections are always returned intact).     |
| has(key), hasIn(path)                           | `boolean` | Checks if the collection includes a value with the key `key`.                                                                                                                                    |
| set(key, value), setIn(path, value)             | `any`     | Sets a value in this collection. For `!!set`, `value` needs to be a boolean to add/remove the item from the set. When overwriting a `Scalar` value with a scalar, the original node is retained. |

<!-- prettier-ignore -->
```js
const doc = new YAML.Document({ a: 1, b: [2, 3] }) // { a: 1, b: [ 2, 3 ] }
doc.add({ key: 'c', value: 4 }) // { a: 1, b: [ 2, 3 ], c: 4 }
doc.addIn(['b'], 5)             // { a: 1, b: [ 2, 3, 5 ], c: 4 }
doc.set('c', 42)                // { a: 1, b: [ 2, 3, 5 ], c: 42 }
doc.setIn(['c', 'x']) // Error: Expected YAML collection at c. Remaining path: x
doc.delete('c')                 // { a: 1, b: [ 2, 3, 5 ] }
doc.deleteIn(['b', 1])          // { a: 1, b: [ 2, 5 ] }

doc.get('a') // 1
doc.get('a', true) // Scalar { value: 1 }
doc.getIn(['b', 1]) // 5
doc.has(doc.createNode('a')) // true
doc.has('c') // false
doc.hasIn(['b', '0']) // true
```

For all of these methods, the keys may be nodes or their wrapped scalar values (i.e. `42` will match `Scalar { value: 42 }`).
Keys for `!!seq` should be positive integers, or their string representations.
`add()` and `set()` do not automatically call `doc.createNode()` to wrap the value.

Each of the methods also has a variant that requires an iterable as the first parameter, and allows fetching or modifying deeper collections.
If any intermediate node in `path` is a scalar rather than a collection, an error will be thrown.
If any of the intermediate collections is not found:

- `getIn` and `hasIn` will return `undefined` or `false` (respectively)
- `addIn` and `setIn` will create missing collections; non-negative integer keys will create sequences, all other keys create maps
- `deleteIn` will throw an error

Note that for `addIn` the path argument points to the collection rather than the item; for maps its `value` should be a `Pair` or an object with `{ key, value }` fields.

## Alias Nodes

<!-- prettier-ignore -->
```js
class Alias extends NodeBase {
  source: string
  resolve(doc: Document): Scalar | YAMLMap | YAMLSeq | undefined
}

const obj = YAML.parse('[ &x { X: 42 }, Y, *x ]')
  // => [ { X: 42 }, 'Y', { X: 42 } ]
obj[2].Z = 13
  // => [ { X: 42, Z: 13 }, 'Y', { X: 42, Z: 13 } ]
YAML.stringify(obj)
  // - &a1
  //   X: 42
  //   Z: 13
  // - Y
  // - *a1
```

`Alias` nodes provide a way to include a single node in multiple places in a document; the `source` of an alias node must be a preceding anchor in the document.
Circular references are fully supported, and where possible the JS representation of alias nodes will be the actual source object.
For ease of use, alias nodes also provide a `resolve(doc)` method to dereference its source node.

When nodes are constructed from JS structures (e.g. during `YAML.stringify()`), multiple references to the same object will result in including an autogenerated anchor at its first instance, and alias nodes to that anchor at later references.

## Creating Nodes

```js
const doc = new YAML.Document(['some', 'values'])
// Document {
//   contents:
//     YAMLSeq {
//       items:
//        [ Scalar { value: 'some' },
//          Scalar { value: 'values' } ] } }

const map = doc.createNode({ balloons: 99 })
// YAMLMap {
//   items:
//    [ Pair {
//        key: Scalar { value: 'balloons' },
//        value: Scalar { value: 99 } } ] }

doc.add(map)
doc.get(0, true).comment = ' A commented item'
String(doc)
// - some # A commented item
// - values
// - balloons: 99
```

#### `doc.createNode(value, replacer?, options?): Node`

To create a new node, use the `createNode(value, options?)` document method.
This will recursively wrap any input with appropriate `Node` containers.
Generic JS `Object` values as well as `Map` and its descendants become mappings, while arrays and other iterable objects result in sequences.
With `Object`, entries that have an `undefined` value are dropped.

If `value` is already a `Node` instance, it will be directly returned.
To create a copy of a node, use instead the `node.clone()` method.
For collections, the method accepts a single `Schema` argument,
which allows overwriting the original's `schema` value.

Use a `replacer` to apply a replacer array or function, following the [JSON implementation][replacer].
To force flow styling on a collection, use the `flow: true` option.
For all available options, see the [CreateNode Options](#createnode-options) section.

[replacer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter

The primary purpose of this method is to enable attaching comments or other metadata to a value, or to otherwise exert more fine-grained control over the stringified output.
To that end, you'll need to assign its return value to the `contents` of a document (or somewhere within said contents), as the document's schema is required for YAML string output.
If you're not interested in working with such metadata, document `contents` may also include non-`Node` values at any level.

<h4 style="clear:both"><code>doc.createAlias(node, name?): Alias</code></h4>

```js
const alias = doc.createAlias(doc.get(1, true), 'foo')
doc.add(alias)
String(doc)
// - some # A commented item
// - &foo values
// - balloons: 99
// - *foo
```

Create a new `Alias` node, ensuring that the target `node` has the required anchor.
If `node` already has an anchor, `name` is ignored.
Otherwise, the `node.anchor` value will be set to `name`, or if an anchor with that name is already present in the document, `name` will be used as a prefix for a new unique anchor.
If `name` is undefined, the generated anchor will use 'a' as a prefix.

You should make sure to only add alias nodes to the document after the nodes to which they refer, or the document's YAML stringification will fail.

<h4 style="clear:both"><code>new YAMLMap(), new YAMLSeq(), doc.createPair(key, value): Pair</code></h4>

```js
import { Document, YAMLSeq } from 'yaml'

const doc = new Document(new YAMLSeq())
doc.contents.items = [
  'some values',
  42,
  { including: 'objects', 3: 'a string' }
]
doc.add(doc.createPair(1, 'a number'))

doc.toString()
// - some values
// - 42
// - "3": a string
//   including: objects
// - 1: a number
```

To construct a `YAMLSeq` or `YAMLMap`, use `new Document()` or `doc.createNode()` with array, object or iterable input, or create the collections directly by importing the classes from `yaml`.

Once created, normal array operations may be used to modify the `items` array.
New `Pair` objects may created either by importing the class from `yaml` and using its `new Pair(key, value)` constructor, or by using the `doc.createPair(key, value, options?)` method.
The latter will recursively wrap the `key` and `value` as nodes, and accepts the same options as `doc.createNode()`

## Identifying Nodes

```js
import {
  isAlias,
  isCollection, // map or seq
  isDocument,
  isMap,
  isNode, // alias, scalar, map or seq
  isPair,
  isScalar,
  isSeq
} from 'yaml'

const doc = new Document({ foo: [13, 42] })
isDocument(doc) === true
isNode(doc) === false
isMap(doc.contents) === true
isNode(doc.contents) === true
isPair(doc.contents.items[0]) === true
isCollection(doc.get('foo')) === true
isScalar(doc.getIn(['foo', 1])) === true
```

#### `isAlias(x: unknown): boolean`

#### `isCollection(x: unknown): boolean`

#### `isDocument(x: unknown): boolean`

#### `isMap(x: unknown): boolean`

#### `isNode(x: unknown): boolean`

#### `isPair(x: unknown): boolean`

#### `isScalar(x: unknown): boolean`

#### `isSeq(x: unknown): boolean`

To find out what you've got, a family of custom type guard functions is provided.
These should be preferred over other methods such as `instanceof` checks, as they'll work even if the nodes have been created by a different instance of the library.

Internally, node identification uses property symbols that are set on instances during their construction.

## Modifying Nodes

```js
const doc = YAML.parseDocument(`
  - some values
  - 42
  - "3": a string
    including: objects
  - 1: a number
`)

const obs = doc.getIn([2, 'including'], true)
obs.type = 'QUOTE_DOUBLE'

YAML.visit(doc, {
  Pair(_, pair) {
    if (pair.key && pair.key.value === '3') return YAML.visit.REMOVE
  },
  Scalar(key, node) {
    if (
      key !== 'key' &&
      typeof node.value === 'string' &&
      node.type === 'PLAIN'
    ) {
      node.type = 'QUOTE_SINGLE'
    }
  }
})

String(doc)
// - 'some values'
// - 42
// - including: "objects"
// - 1: 'a number'
```

In general, it's safe to modify nodes manually, e.g. splicing the `items` array of a `YAMLMap` or setting its `flow` value to `true`.
For operations on nodes at a known location in the tree, it's probably easiest to use `doc.getIn(path, true)` to access them.
For more complex or general operations, a visitor API is provided:

#### `YAML.visit(node, visitor): void`

Apply a visitor to an AST node or document.

Walks through the tree (depth-first) starting from `node`, calling a `visitor` function with three arguments:

- `key`: For sequence values and map `Pair`, the node's index in the collection.
  Within a `Pair`, `'key'` or `'value'`, correspondingly.
  `null` for the root node.
- `node`: The current node.
- `path`: The ancestry of the current node.

The return value of the visitor may be used to control the traversal:

- `undefined` (default): Do nothing and continue
- `YAML.visit.SKIP`: Do not visit the children of this node, continue with next sibling
- `YAML.visit.BREAK`: Terminate traversal completely
- `YAML.visit.REMOVE`: Remove the current node, then continue with the next one
- `Node`: Replace the current node, then continue by visiting it
- `number`: While iterating the items of a sequence or map, set the index of the next step.
  This is useful especially if the index of the current node has changed.

If `visitor` is a single function, it will be called with all values encountered in the tree, including e.g. `null` values.
Alternatively, separate visitor functions may be defined for each `Map`, `Pair`, `Seq`, `Alias` and `Scalar` node.
To define the same visitor function for more than one node type,
use the `Collection` (map and seq), `Value` (map, seq & scalar) and `Node` (alias, map, seq & scalar) targets.
Of all these, only the most specific defined one will be used for each node.

#### `YAML.visitAsync(node, visitor): Promise<void>`

The same as `visit()`,
but allows for visitor functions that return a promise
which resolves to one of the above-defined control values.

## Comments and Blank Lines

```js
const doc = YAML.parseDocument(`
# This is YAML.
---
it has:

  - an array

  - of values
`)

doc.toJS() // { 'it has': [ 'an array', 'of values' ] }
doc.commentBefore // ' This is YAML.'

const seq = doc.get('it has')
seq.spaceBefore // true

seq.items[0].comment = ' item comment'
seq.comment = ' collection end comment'

doc.toString()
// # This is YAML.
//
// it has:
//
//   - an array # item comment
//
//   - of values
//   # collection end comment
```

A primary differentiator between this and other YAML libraries is the ability to programmatically handle comments, which according to [the spec](http://yaml.org/spec/1.2/spec.html#id2767100)
"must not have any effect on the serialization tree or representation graph. In particular, comments are not associated with a particular node."
Similarly to comments, the YAML spec instructs non-content blank lines to be discarded.

This library _does_ allow comments and blank lines to be handled programmatically, and does attach them to particular nodes (most often, the following node).
Each `Scalar`, `Map`, `Seq` and the `Document` itself has `comment`, `commentBefore` members that may be set to a stringifiable value, and a `spaceBefore` boolean to add an empty line before the comment.

The string contents of comments are not processed by the library, except for merging adjacent comment and blank lines together.
Document comments will be separated from the rest of the document by a blank line.
In the node member values, comment lines terminating with the `#` indicator are represented by a single space, while completely empty lines are represented as empty strings.

Scalar block values with "keep" chomping (i.e. with `+` in their header) consider any trailing empty lines to be a part of their content, so the following node's `spaceBefore` or `commentBefore` with leading whitespace is ignored.

**Note**: Due to implementation details, the library's comment handling is not completely stable, in particular for trailing comments.
When creating, writing, and then reading a YAML file, comments may sometimes be associated with a different node.
