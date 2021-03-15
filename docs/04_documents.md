# Documents

In order to work with YAML features not directly supported by native JavaScript data types, such as comments, anchors and aliases, `yaml` provides the `Document` API.

## Parsing Documents

```js
import fs from 'fs'
import { parseAllDocuments, parseDocument } from 'yaml'

const file = fs.readFileSync('./file.yml', 'utf8')
const doc = parseDocument(file)
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

#### `parseDocument(str, options = {}): Document`

Parses a single `Document` from the input `str`; used internally by `parse`.
Will include an error if `str` contains more than one document.
See [Options](#options) for more information on the second parameter.

<br/>

#### `parseAllDocuments(str, options = {}): Document[]`

When parsing YAML, the input string `str` may consist of a stream of documents separated from each other by `...` document end marker lines.
`parseAllDocuments` will return an array of `Document` objects that allow these documents to be parsed and manipulated with more control.
See [Options](#options) for more information on the second parameter.

<br/>

These functions should never throw; errors and warnings are included in the documents' `errors` and `warnings` arrays. In particular, if `errors` is not empty it's likely that the document's parsed `contents` are not entirely correct.

The `contents` of a parsed document will always consist of `Scalar`, `Map`, `Seq` or `null` values.

## Creating Documents

#### `new Document(value, replacer?, options = {})`

Creates a new document.
If `value` is defined, the document `contents` are initialised with that value, wrapped recursively in appropriate [content nodes](#content-nodes).
If `value` is `undefined`, the document's `contents` is initialised as `null`.
If defined, a `replacer` may filter or modify the initial document contents, following the same algorithm as the [JSON implementation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter).
See [Options](#options) for more information on the last argument.

| Member        | Type                               | Description                                                                                                                                                         |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| anchors       | [`Anchors`](#anchors)              | Anchors associated with the document's nodes; also provides alias & merge node creators.                                                                            |
| commentBefore | `string?`                          | A comment at the very beginning of the document. If not empty, separated from the rest of the document by a blank line or the doc-start indicator when stringified. |
| comment       | `string?`                          | A comment at the end of the document. If not empty, separated from the rest of the document by a blank line when stringified.                                       |
| contents      | [`Node`](#content-nodes) `⎮ any`   | The document contents.                                                                                                                                              |
| directives    | [`Directives`](#stream-directives) | Controls for the `%YAML` and `%TAG` directives, as well as the doc-start marker `---`.                                                                              |
| errors        | [`Error[]`](#errors)               | Errors encountered during parsing.                                                                                                                                  |
| schema        | `Schema`                           | The schema used with the document.                                                                                                                                  |
| warnings      | [`Error[]`](#errors)               | Warnings encountered during parsing.                                                                                                                                |

```js
import { Document } from 'yaml'

const doc = new Document(['some', 'values', { balloons: 99 }])
doc.commentBefore = ' A commented document'

String(doc)
// # A commented document
//
// - some
// - values
// - balloons: 99
```

The Document members are all modifiable, though it's unlikely that you'll have reason to change `errors`, `schema` or `warnings`.
In particular you may be interested in both reading and writing **`contents`**.
Although `parseDocument()` and `parseAllDocuments()` will leave it with `YAMLMap`, `YAMLSeq`, `Scalar` or `null` contents, it can be set to anything.

## Document Methods

| Method                                     | Returns  | Description                                                                                                                       |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| createNode(value,&nbsp;options?)           | `Node`   | Recursively wrap any input with appropriate `Node` containers. See [Creating Nodes](#creating-nodes) for more information.        |
| createPair(key,&nbsp;value,&nbsp;options?) | `Pair`   | Recursively wrap `key` and `value` into a `Pair` object. See [Creating Nodes](#creating-nodes) for more information.              |
| setSchema(version,&nbsp;options?)          | `void`   | Change the YAML version and schema used by the document. `version` must be either `'1.1'` or `'1.2'`; accepts all Schema options. |
| toJS(options?)                             | `any`    | A plain JavaScript representation of the document `contents`.                                                                     |
| toJSON()                                   | `any`    | A JSON representation of the document `contents`.                                                                                 |
| toString(options?)                         | `string` | A YAML representation of the document.                                                                                            |

```js
const doc = parseDocument('a: 1\nb: [2, 3]\n')
doc.get('a') // 1
doc.getIn([]) // YAMLMap { items: [Pair, Pair], ... }
doc.hasIn(['b', 0]) // true
doc.addIn(['b'], 4) // -> doc.get('b').items.length === 3
doc.deleteIn(['b', 1]) // true
doc.getIn(['b', 1]) // 4
```

In addition to the above, the document object also provides the same **accessor methods** as [collections](#collections), based on the top-level collection:
`add`, `delete`, `get`, `has`, and `set`, along with their deeper variants `addIn`, `deleteIn`, `getIn`, `hasIn`, and `setIn`.
For the `*In` methods using an empty `path` value (i.e. `null`, `undefined`, or `[]`) will refer to the document's top-level `contents`.

#### `Document#toJS()`, `Document#toJSON()` and `Document#toString()`

```js
const src = '1969-07-21T02:56:15Z'
const doc = parseDocument(src, { customTags: ['timestamp'] })

doc.toJS()
// Date { 1969-07-21T02:56:15.000Z }

doc.toJSON()
// '1969-07-21T02:56:15.000Z'

String(doc)
// '1969-07-21T02:56:15\n'
```

For a plain JavaScript representation of the document, **`toJS(options = {})`** is your friend.
Its output may include `Map` and `Set` collections (e.g. if the `mapAsMap` option is true) and complex scalar values like `Date` for `!!timestamp`, but all YAML nodes will be resolved.
See [Options](#options) for more information on the optional parameter.

For a representation consisting only of JSON values, use **`toJSON()`**.

To stringify a document as YAML, use **`toString(options = {})`**.
This will also be called by `String(doc)` (with no options).
This method will throw if the `errors` array is not empty.
See [Options](#options) for more information on the optional parameter.

## Stream Directives

<!-- prettier-ignore -->
```js
const doc = new Document()
doc.directives
> {
    marker: null, // set true to force the doc-start marker
    tags: { '!!': 'tag:yaml.org,2002:' }, // Record<handle, prefix>
    yaml: { explicit: false, version: '1.2' }
  }
```

A YAML document may be preceded by `%YAML` and `%TAG` directives; their state is accessible via the `directives` member of a `Document`.
After parsing or other creation, the contents of `doc.directives` are mutable, and will influence the YAML string representation of the document.

The contents of `doc.directives.tags` are used both for the `%TAG` directives and when stringifying tags within the document.
Each of the handles must start and end with a `!` character; `!` is by default the local tag and `!!` is used for default tags.
See the section on [custom tags](#writing-custom-tags) for more on this topic.

`doc.contents.yaml` determines if an explicit `%YAML` directive should be included in the output, and what version it should use.
If changing the version after the document's creation, you'll probably want to use `doc.setSchema()` as it will also update the schema accordingly.

## Working with Anchors

A description of [alias and merge nodes](#alias-nodes) is included in the next section.

<br/>

#### `Document#anchors`

| Method                                 | Returns    | Description                                                                                                                |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| createAlias(node: Node, name?: string) | `Alias`    | Create a new `Alias` node, adding the required anchor for `node`. If `name` is empty, a new anchor name will be generated. |
| getName(node: Node)                    | `string?`  | The anchor name associated with `node`, if set.                                                                            |
| getNames()                             | `string[]` | List of all defined anchor names.                                                                                          |
| getNode(name: string)                  | `Node?`    | The node associated with the anchor `name`, if set.                                                                        |
| newName(prefix: string)                | `string`   | Find an available anchor name with the given `prefix` and a numerical suffix.                                              |
| setAnchor(node?: Node, name?: string)  | `string?`  | Associate an anchor with `node`. If `name` is empty, a new name will be generated.                                         |

```js
const src = '[{ a: A }, { b: B }]'
const doc = parseDocument(src)
doc.anchors.setAnchor(doc.getIn([0, 'a'], true)) // 'a1'
doc.anchors.setAnchor(doc.getIn([1, 'b'], true)) // 'a2'
doc.anchors.setAnchor(null, 'a1') // 'a1'
doc.anchors.getNode('a2')
// { value: 'B', range: [ 16, 18 ], type: 'PLAIN' }
String(doc)
// [ { a: A }, { b: &a2 B } ]

const alias = doc.anchors.createAlias(doc.get(0, true), 'AA')
// Alias { source: YAMLMap { items: [ [Pair] ] } }
doc.add(alias)
doc.toJS()
// [ { a: 'A' }, { b: 'B' }, { a: 'A' } ]
String(doc)
// [ &AA { a: A }, { b: &a2 B }, *AA ]

doc.setSchema('1.2', { merge: true })
const merge = doc.createPair('<<', alias)
// Pair {
//   key: Scalar { value: '<<' },
//   value: Alias { source: YAMLMap { ... } } }
doc.addIn([1], merge)
doc.toJS()
// [ { a: 'A' }, { b: 'B', a: 'A' }, { a: 'A' } ]
String(doc)
// [ &AA { a: A }, { b: &a2 B, <<: *AA }, *AA ]

// This creates a circular reference
merge.value = doc.anchors.createAlias(doc.get(1, true))
doc.toJS() // [RangeError: Maximum call stack size exceeded]
String(doc)
// [
//   &AA { a: A },
//   &a1 { b: &a2 B, <<: *a1 },
//   *AA
// ]
```

You should make sure to only add alias and merge nodes to the document after the nodes to which they refer, or the document's YAML stringification will fail.

It is valid to have an anchor associated with a node even if it has no aliases.
`yaml` will not allow you to associate the same name with more than one node, even though this is allowed by the YAML spec (all but the last instance will have numerical suffixes added).
To add or reassign an anchor, use **`setAnchor(node, name)`**.
The second parameter is optional, and if left out either the pre-existing anchor name of the node will be used, or a new one generated.
To remove an anchor, use `setAnchor(null, name)`.
The function will return the new anchor's name, or `null` if both of its arguments are `null`.

While the `merge` option needs to be true to parse merge pairs as such, this is not required during stringification.
