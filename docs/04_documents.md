# Documents

In order to work with YAML features not directly supported by native JavaScript data types, such as comments, anchors and aliases, `yaml` provides the `YAML.Document` API.

## Parsing Documents

```js
import fs from 'fs'
import YAML from 'yaml'

const file = fs.readFileSync('./file.yml', 'utf8')
const doc = YAML.parseDocument(file)
doc.contents
// YAMLMap {
//   items:
//    [ Pair {
//        key: Scalar { value: 'YAML', range: [ 0, 4 ] },
//        value:
//         YAMLSeq {
//           items:
//            [ Scalar {
//                value: 'A human-readable data serialization language',
//                range: [ 10, 55 ] },
//              Scalar {
//                value: 'https://en.wikipedia.org/wiki/YAML',
//                range: [ 59, 94 ] } ],
//           tag: 'tag:yaml.org,2002:seq',
//           range: [ 8, 94 ] } },
//      Pair {
//        key: Scalar { value: 'yaml', range: [ 94, 98 ] },
//        value:
//         YAMLSeq {
//           items:
//            [ Scalar {
//                value: 'A complete JavaScript implementation',
//                range: [ 104, 141 ] },
//              Scalar {
//                value: 'https://www.npmjs.com/package/yaml',
//                range: [ 145, 180 ] } ],
//           tag: 'tag:yaml.org,2002:seq',
//           range: [ 102, 180 ] } } ],
//   tag: 'tag:yaml.org,2002:map',
//   range: [ 0, 180 ] }
```

#### `YAML.parseDocument(str, options = {}): YAML.Document`

Parses a single `YAML.Document` from the input `str`; used internally by `YAML.parse`. Will include an error if `str` contains more than one document. See [Options](#options) for more information on the second parameter.

<br/>

#### `YAML.parseAllDocuments(str, options = {}): YAML.Document[]`

When parsing YAML, the input string `str` may consist of a stream of documents separated from each other by `...` document end marker lines. `YAML.parseAllDocuments` will return an array of `Document` objects that allow these documents to be parsed and manipulated with more control. See [Options](#options) for more information on the second parameter.

<br/>

These functions should never throw; errors and warnings are included in the documents' `errors` and `warnings` arrays. In particular, if `errors` is not empty it's likely that the document's parsed `contents` are not entirely correct.

The `contents` of a parsed document will always consist of `Scalar`, `Map`, `Seq` or `null` values.

## Creating Documents

#### `new YAML.Document(options = {})`

| Member              | Type                                | Description                                                                                                                                                              |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| anchors             | [`Anchors`](#anchors)               | Anchors associated with the document's nodes; also provides alias & merge node creators.                                                                                 |
| commentBefore       | `string?`                           | A comment at the very beginning of the document. If not empty, separated from the rest of the document by a blank line or the directives-end indicator when stringified. |
| comment             | `string?`                           | A comment at the end of the document. If not empty, separated from the rest of the document by a blank line when stringified.                                            |
| contents            | [`Node`](#content-nodes)&vert;`any` | The document contents.                                                                                                                                                   |
| directivesEndMarker | `boolean?`                          | Whether the document should always include a directives-end marker `---` at its start, even if it includes no directives.                                                |
| errors              | `Error[]`                           | Errors encountered during parsing.                                                                                                                                       |
| schema              | `Schema`                            | The schema used with the document.                                                                                                                                       |
| tagPrefixes         | `Prefix[]`                          | Array of prefixes; each will have a string `handle` that starts and ends with `!` and a string `prefix` that the handle will be replaced by.                             |
| version             | `string?`                           | The parsed version of the source document; if true-ish, stringified output will include a `%YAML` directive.                                                             |
| warnings            | `Error[]`                           | Warnings encountered during parsing.                                                                                                                                     |

```js
const doc = new YAML.Document()
doc.version = true
doc.commentBefore = ' A commented document'
doc.contents = ['some', 'values', { balloons: 99 }]

String(doc)
// # A commented document
// %YAML 1.2
// ---
// - some
// - values
// - balloons: 99
```

The Document members are all modifiable, though it's unlikely that you'll have reason to change `errors`, `schema` or `warnings`. In particular you may be interested in both reading and writing **`contents`**. Although `YAML.parseDocument()` and `YAML.parseAllDocuments()` will leave it with `Map`, `Seq`, `Scalar` or `null` contents, it can be set to anything.

During stringification, a document with a true-ish `version` value will include a `%YAML` directive; the version number will be set to `1.2` unless the `yaml-1.1` schema is in use.

## Document Methods

| Method                       | Returns    | Description                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| listNonDefaultTags()         | `string[]` | List the tags used in the document that are not in the default `tag:yaml.org,2002:` namespace.                                                                                                                                                                                                                                                                                                           |
| parse(cst)                   | `Document` | Parse a CST into this document. Mostly an internal method, modifying the document according to the contents of the parsed `cst`. Calling this multiple times on a Document is not recommended.                                                                                                                                                                                                           |
| setSchema(id, customTags)    | `void`     | When a document is created with `new YAML.Document()`, the schema object is not set as it may be influenced by parsed directives; call this with no arguments to set it manually, or with arguments to change the schema used by the document. `id` may either be a YAML version, or the identifier of a YAML 1.2 schema; if set, `customTags` should have the same shape as the similarly-named option. |
| setTagPrefix(handle, prefix) | `void`     | Set `handle` as a shorthand string for the `prefix` tag namespace.                                                                                                                                                                                                                                                                                                                                       |
| toJSON()                     | `any`      | A plain JavaScript representation of the document `contents`.                                                                                                                                                                                                                                                                                                                                            |
| toString()                   | `string`   | A YAML representation of the document.                                                                                                                                                                                                                                                                                                                                                                   |

```js
const doc = YAML.parseDocument('a: 1\nb: [2, 3]\n')
doc.get('a') // 1
doc.getIn([]) // YAMLMap { items: [Pair, Pair], ... }
doc.hasIn(['b', 0]) // true
doc.addIn(['b'], 4) // -> doc.get('b').items.length === 3
doc.deleteIn(['b', 1]) // true
doc.getIn(['b', 1]) // 4
```

In addition to the above, the document object also provides the same **accessor methods** as [collections](#collections), based on the top-level collection: `add`, `delete`, `get`, `has`, and `set`, along with their deeper variants `addIn`, `deleteIn`, `getIn`, `hasIn`, and `setIn`. For the `*In` methods using an empty `path` value (i.e. `null`, `undefined`, or `[]`) will refer to the document's top-level `contents`.

To define a tag prefix to use when stringifying, use **`setTagPrefix(handle, prefix)`** rather than setting a value directly in `tagPrefixes`. This will guarantee that the `handle` is valid (by throwing an error), and will overwrite any previous definition for the `handle`. Use an empty `prefix` value to remove a prefix.

```js
const src = '1969-07-21T02:56:15Z'
const doc = YAML.parseDocument(src, { customTags: ['timestamp'] })

doc.toJSON()
// Date { 1969-07-21T02:56:15.000Z }

doc.options.keepBlobsInJSON = false
doc.toJSON()
// '1969-07-21T02:56:15.000Z'

String(doc)
// '1969-07-21T02:56:15\n'
```

For a plain JavaScript representation of the document, **`toJSON()`** is your friend. By default the values wrapped in scalar nodes will not be forced to JSON, so e.g. a `!!timestamp` will remain a `Date` in the output. To change this behaviour and enforce JSON values only, set the [`keepBlobsInJSON` option](#options) to `false`.

Conversely, to stringify a document as YAML, use **`toString()`**. This will also be called by `String(doc)`. This method will throw if the `errors` array is not empty.

## Working with Anchors

A description of [alias and merge nodes](#alias-nodes) is included in the next section.

<br/>

#### `YAML.Document#anchors`

| Method                                 | Returns   | Description                                                                                                                |
| -------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| createAlias(node: Node, name?: string) | `Alias`   | Create a new `Alias` node, adding the required anchor for `node`. If `name` is empty, a new anchor name will be generated. |
| createMergePair(...Node)               | `Merge`   | Create a new `Merge` node with the given source nodes. Non-`Alias` sources will be automatically wrapped.                  |
| getName(node: Node)                    | `string?` | The anchor name associated with `node`, if set.                                                                            |
| getNode(name: string)                  | `Node?`   | The node associated with the anchor `name`, if set.                                                                        |
| newName(prefix: string)                | `string`  | Find an available anchor name with the given `prefix` and a numerical suffix.                                              |
| setAnchor(node: Node, name?: string)   | `string?` | Associate an anchor with `node`. If `name` is empty, a new name will be generated.                                         |

```js
const src = '[{ a: A }, { b: B }]'
const doc = YAML.parseDocument(src)
const { anchors, contents } = doc
const [a, b] = contents.items
anchors.setAnchor(a.items[0].value) // 'a1'
anchors.setAnchor(b.items[0].value) // 'a2'
anchors.setAnchor(null, 'a1') // 'a1'
anchors.getName(a) // undefined
anchors.getNode('a2')
// { value: 'B', range: [ 16, 18 ], type: 'PLAIN' }
String(doc)
// [ { a: A }, { b: &a2 B } ]

const alias = anchors.createAlias(a, 'AA')
contents.items.push(alias)
doc.toJSON()
// [ { a: 'A' }, { b: 'B' }, { a: 'A' } ]
String(doc)
// [ &AA { a: A }, { b: &a2 B }, *AA ]

const merge = anchors.createMergePair(alias)
b.items.push(merge)
doc.toJSON()
// [ { a: 'A' }, { b: 'B', a: 'A' }, { a: 'A' } ]
String(doc)
// [ &AA { a: A }, { b: &a2 B, <<: *AA }, *AA ]

// This creates a circular reference
merge.value.items.push(anchors.createAlias(b))
doc.toJSON() // [RangeError: Maximum call stack size exceeded]
String(doc)
// [
//   &AA { a: A },
//   &a3 {
//       b: &a2 B,
//       <<:
//         [ *AA, *a3 ]
//     },
//   *AA
// ]
```

The constructors for `Alias` and `Merge` are not directly exported by the library, as they depend on the document's anchors; instead you'll need to use **`createAlias(node, name)`** and **`createMergePair(...sources)`**. You should make sure to only add alias and merge nodes to the document after the nodes to which they refer, or the document's YAML stringification will fail.

It is valid to have an anchor associated with a node even if it has no aliases. `yaml` will not allow you to associate the same name with more than one node, even though this is allowed by the YAML spec (all but the last instance will have numerical suffixes added). To add or reassign an anchor, use **`setAnchor(node, name)`**. The second parameter is optional, and if left out either the pre-existing anchor name of the node will be used, or a new one generated. To remove an anchor, use `setAnchor(null, name)`. The function will return the new anchor's name, or `null` if both of its arguments are `null`.

While the `merge` option needs to be true to parse `Merge` nodes as such, this is not required during stringification.
