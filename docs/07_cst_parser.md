# CST Parser

For ease of implementation and to provide better error handling and reporting, the lowest level of the library's parser turns any input string into a [**Concrete Syntax Tree**](https://en.wikipedia.org/wiki/Concrete_syntax_tree) of nodes as if the input were YAML. This level of the API has not been designed to be particularly user-friendly for external users, but it is fast, robust, and not dependent on the rest of the library.

## parseCST

```js
import parseCST from 'yaml/parse-cst'

const cst = parseCST(`
sequence: [ one, two, ]
mapping: { sky: blue, sea: green }
---
-
  "flow in block"
- >
 Block scalar
- !!map # Block collection
  foo : bar
`)

cst[0]            // first document, containing a map with two keys
  .contents[0]    // document contents (as opposed to directives)
  .items[3].node  // the last item, a flow map
  .items[3]       // the fourth token, parsed as a plain value
  .strValue       // 'blue'

cst[1]            // second document, containing a sequence
  .contents[0]    // document contents (as opposed to directives)
  .items[1].node  // the second item, a block value
  .strValue       // 'Block scalar\n'
```

#### `parseCST(string): CSTDocument[]`

#### `YAML.parseCST(string): CSTDocument[]`

The CST parser will not produce a CST that is necessarily valid YAML, and in particular its representation of collections of items is expected to undergo further processing and validation. The parser should never throw errors, but may include them as a value of the relevant node. On the other hand, if you feed it garbage, you'll likely get a garbage CST as well.

The public API of the CST layer is a single function which returns an array of parsed CST documents. The array and its contained nodes override the default `toString` method, each returning a YAML string representation of its contents. The same function is exported as a part of the default `YAML` object, as well as seprately at `yaml/parse-cst`. It has no dependency on the rest of the library, so importing only `parseCST` should add about 9kB to your gzipped bundle size, when the whole library will add about 27kB.

Care should be taken when modifying the CST, as no error checks are included to verify that the resulting YAML is valid, or that e.g. indentation levels aren't broken. In other words, this is an engineering tool and you may hurt yourself. If you're looking to generate a brand new YAML document, see the section on [Creating Documents](#creating-documents).

For more usage examples and CST trees, have a look through the [extensive test suite](https://github.com/eemeli/yaml/tree/master/tests/cst) included in the project's repository.

<h3 style="clear:both">Error detection</h3>

```js
import YAML from 'yaml'

const cst = YAML.parseCST('this: is: bad YAML')

cst[0].contents[0]  // Note: Simplified for clarity
// { type: 'MAP',
//   items: [
//     { type: 'PLAIN', strValue: 'this' },
//     { type: 'MAP_VALUE',
//       node: {
//         type: 'MAP',
//         items: [
//           { type: 'PLAIN', strValue: 'is' },
//           { type: 'MAP_VALUE',
//             node: { type: 'PLAIN', strValue: 'bad YAML' } } ] } } ] }

const doc = new YAML.Document()
doc.parse(cst[0])
doc.errors
// [ {
//   name: 'YAMLSemanticError',
//   message: 'Nested mappings are not allowed in compact mappings',
//   source: {
//     type: 'MAP',
//     range: { start: 6, end: 18 },
//     ...,
//     rawValue: 'is: bad YAML' } } ]

doc.contents.items[0].value.items[0].value.value
// 'bad YAML'
```

While the YAML spec considers e.g. block collections within a flow collection to be an error, this error will not be detected by the CST parser. For complete validation, you will need to parse the CST into a `YAML.Document`. If the document contains errors, they will be included in the document's `errors` array, and each error will will contain a `source` reference to the CST node where it was encountered. Do note that even if an error is encountered, the document contents might still be available. In such a case, the error will be a [`YAMLSemanticError`](#yamlsemanticerror) rather than a [`YAMLSyntaxError`](#yamlsyntaxerror).

<h3 style="clear:both">Dealing with CRLF line terminators</h3>

```js
import parseCST from 'yaml/parse-cst'

const src = '- foo\r\n- bar\r\n'
const cst = parseCST(src)
cst.setOrigRanges() // true
const { range, valueRange } = cst[0].contents[0].items[1].node

src.slice(range.origStart, range.origEnd)
// 'bar\r\n'

src.slice(valueRange.origStart, valueRange.origEnd)
// 'bar'
```

#### `CST#setOrigRanges(): bool`

The array returned by `parseCST()` will also include a method `setOrigRanges` to help deal with input that includes `\r\n` line terminators, which are converted to just `\n` before parsing into documents. This conversion will obviously change the total length of the string, as well as the offsets of all ranges. If the method returns `false`, the input did not include `\r\n` line terminators and no changes were made. However, if the method returns `true`, each `Range` object within the CST will have its `origStart` and `origEnd` values set appropriately to refer to the original input string.

## CST Nodes

> Node type definitions use Flow-ish notation, so `+` as a prefix indicates a read-only getter property.

```js
class Range {
  start: number,        // offset of first character
  end: number,          // offset after last character
  isEmpty(): boolean,   // true if end is not greater than start
  origStart: ?number,   // set by CST#setOrigRanges(), source
  origEnd: ?number      //   offsets for input with CRLF terminators
}
```

**Note**: The `Node`, `Scalar` and other values referred to in this section are the CST representations of said objects, and are not the same as those used in preceding parts.

Actual values in the CST nodes are stored as `start`, `end` indices of the input string. This allows for memory consumption to be minimised by making string generation really lazy.

<h3 style="clear:both">Node</h3>

```js
class Node {
  context: {            // not enumerable, to simplify logging
    atLineStart: boolean, // is this node the first one on this line
    indent: number,     // current level of indentation (may be -1)
    root: CSTDocument,  // a reference to the parent document
    src: string         // the full original source
  },
  error: ?Error,        // if not null, indicates a parser failure
  props: Array<Range>,  // anchors, tags and comments
  range: Range,         // span of context.src parsed into this node
  type:                 // specific node type
    'ALIAS' | 'BLOCK_FOLDED' | 'BLOCK_LITERAL' | 'COMMENT' |
    'DIRECTIVE' | 'DOCUMENT' | 'FLOW_MAP' | 'FLOW_SEQ' |
    'MAP' | 'MAP_KEY' | 'MAP_VALUE' | 'PLAIN' |
    'QUOTE_DOUBLE' | 'QUOTE_SINGLE' | 'SEQ' | 'SEQ_ITEM',
  value: ?string        // if set to a non-null value, overrides
                        //   source value when stringified
  +anchor: ?string,     // anchor, if set
  +comment: ?string,    // newline-delimited comment(s), if any
  +rangeAsLinePos:      // human-friendly source location
    ?{ start: LinePos, end: ?LinePos },
    // LinePos here is { line: number, col: number }
  +rawValue: ?string,   // an unprocessed slice of context.src
                        //   determining this node's value
  +tag:                 // this node's tag, if set
    null | { verbatim: string } | { handle: string, suffix: string },
  toString(): string    // a YAML string representation of this node
}

type ContentNode =
  Comment | Alias | Scalar | Map | Seq | FlowCollection
```

Each node in the CST extends a common ancestor `Node`. Additional undocumented properties are available, but are likely only useful during parsing.

If a node has its `value` set, that will be used when re-stringifying (initially `undefined` for all nodes).

<h3 style="clear:both">Scalars</h3>

```js
class Alias extends Node {
  // rawValue will contain the anchor without the * prefix
  type: 'ALIAS'
}

class Scalar extends Node {
  type: 'PLAIN' | 'QUOTE_DOUBLE' | 'QUOTE_SINGLE' |
    'BLOCK_FOLDED' | 'BLOCK_LITERAL'
  +strValue: ?string |  // unescaped string value
    { str: string, errors: YAMLSyntaxError[] }
}

class Comment extends Node {
  type: 'COMMENT',      // PLAIN nodes may also be comment-only
  +anchor: null,
  +comment: string,
  +rawValue: null,
  +tag: null
}

class BlankLine extends Comment {
  type: 'BLANK_LINE',   // represents a single blank line, which
  +comment: null        //   may include whitespace
}
```

While `Alias`, `BlankLine` and `Comment` nodes are not technically scalars, they are parsed as such at this level.

Due to parsing differences, each scalar type is implemented using its own class.

<h3 style="clear:both">Collections</h3>

```js
class MapItem extends Node {
  node: ContentNode | null,
  type: 'MAP_KEY' | 'MAP_VALUE'
}

class Map extends Node {
  // implicit keys are not wrapped
  items: Array<Comment | Alias | Scalar | MapItem>,
  type: 'MAP'
}

class SeqItem extends Node {
  node: ContentNode | null,
  type: 'SEQ_ITEM'
}

class Seq extends Node {
  items: Array<Comment | SeqItem>,
  type: 'SEQ'
}

type FlowChar = '{' | '}' | '[' | ']' | ',' | '?' | ':'

class FlowCollection extends Node {
  items: Array<FlowChar | Comment | Alias | Scalar | FlowCollection>,
  type: 'FLOW_MAP' | 'FLOW_SEQ'
}
```

Block and flow collections are parsed rather differently, due to their representation differences.

An `Alias` or `Scalar` item directly within a `Map` should be treated as an implicit map key.

In actual code, `MapItem` and `SeqItem` are implemented as `CollectionItem`, and correspondingly `Map` and `Seq` as `Collection`.

<h3 style="clear:both">Document Structure</h3>

```js
class Directive extends Node {
  name: string,  // should only be 'TAG' or 'YAML'
  type: 'DIRECTIVE',
  +anchor: null,
  +parameters: Array<string>,
  +tag: null
}

class CSTDocument extends Node {
  directives: Array<Comment | Directive>,
  contents: Array<ContentNode>,
  type: 'DOCUMENT',
  directivesEndMarker: Range | null,
  documentEndMarker: Range | null,
  +anchor: null,
  +comment: null,
  +tag: null
}
```

The CST tree of a valid YAML document should have a single non-`Comment` `ContentNode` in its `contents` array. Multiple values indicates that the input is malformed in a way that made it impossible to determine the proper structure of the document. If `directivesEndMarker` or `documentEndMarker` are non-empty, the document includes (respectively) a directives-end marker `---` or a document-end marker `...` with the indicated range.
