# raw-yaml
### Read anything as YAML

A maximally liberal [YAML 1.2] parser:
- Will do its best to turn any string input into a YAML-ish AST representation
- Fully supports programmatic handling of YAML comments and multi-document streams
- Does practically no error checking, and should never throw -- but if you feed it garbage, you'll likely get a garbage AST as well
- Has no runtime dependencies and compresses to under 9kB
- Minimises memory consumption by being really lazy; doesn't even calculate raw string values until you specifically ask for them
- Output object overrides `toString` at all levels to provide an idempotent YAML string representation
- Allows (slightly clumsy) editing with a settable `Node#value`
- Tested against all examples included in the YAML 1.2 spec

[YAML 1.2]: http://www.yaml.org/spec/1.2/spec.html


## Usage & API

To install:
```
npm install raw-yaml
```

To use:
```js
import parse from 'raw-yaml'

const str = `
sequence: [ one, two, ]
mapping: { sky: blue, sea: green }
---
-
  "flow in block"
- >
 Block scalar
- !!map # Block collection
  foo : bar`

const ast = parse(str)

ast[0]            // first document, containing a map with two keys
  .contents[0]    // document contents (as opposed to directives)
  .items[3].item  // the last item, a flow map
  .items[3]       // the fourth token, parsed as a plain value
  .strValue       // 'blue'

ast[1]            // second document, containing a sequence
  .contents[0]    // document contents (as opposed to directives)
  .items[1].item  // the second item, a block value
  .strValue       // 'Block scalar\n'
```

### `parse(string): Array<Document>`

The public API of the library is a single function which returns an array of parsed YAML documents (see below for details). The array and its contained nodes override the default `toString` method, each returning a YAML representation of its contents.

If a node has its `value` set, that will be used when re-stringifying. Care should be taken when modifying the AST, as no error checks are included to verify that the resulting YAML is valid, or that e.g. indentation levels aren't broken. In other words, this is an engineering tool and you may hurt yourself. If you're looking to generate a brand new YAML document, you should probably not be using this library directly.

If using the module in a CommonJS environment, the default-exported function is available at `require('raw-yaml').default`.

For more usage examples and AST trees, take a look through the [`__tests__`](https://github.com/eemeli/raw-yaml/tree/master/__tests__) directory.


## AST Structure

For an example, here's what the first few lines of this file look like when parsed by raw-yaml (simplified for clarity):

```js
[ {
  directives: [
    { comment: ' raw-yaml' },
    { comment: '## Read anything as YAML' }
  ],
  contents: [
    { items: [
      'A maximally liberal YAML 1.2 parser',
      { indicator: ':', item: { items: [
        { indicator: '-', item: 'Will do its best...' },
        { indicator: '-', item: 'Fully supports...' }
      ] } }
    ] }
  ]
} ]
```

Each node in the AST extends a common ancestor `Node` (using flow-ish notation, so `+` as a prefix indicates a read-only property:

```js
class Range {
  start: number,        // offset of first character
  end: number,          // offset after last character
  +isEmpty: boolean     // true if end is not greater than start
}

class Node {
  context: {
    atLineStart: boolean, // is this node the first one on this line
    indent: number,     // current level of indentation (may be -1)
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
  value: ?string        // if non-null, overrides source value
  +anchor: ?string,     // anchor, if set
  +comment: ?string,    // newline-delimited comment(s), if any
  +rawValue: ?string,   // an unprocessed slice of context.src
                        //   determining this node's value
  +tag: ?string,        // this node's tag, if set
  toString(): string    // a YAML string representation of this node
}

class Alias extends Node {
  // rawValue will contain the * prefix, followed by the anchor
  type: 'ALIAS'
}

class Scalar extends Node {
  type: 'PLAIN' | 'QUOTE_DOUBLE' | 'QUOTE_SINGLE' |
    'BLOCK_FOLDED' | 'BLOCK_LITERAL'
  +strValue: ?string    // unescaped string value; may throw for
                        //   QUOTE_DOUBLE on bad escape sequences
}

class Comment extends Node {
  type: 'COMMENT',      // PLAIN nodes may also be comment-only
  +anchor: null,
  +comment: string,
  +rawValue: null,
  +tag: null
}

class MapItem extends Node {
  indicator: '?' | ':',
  item: ContentNode | null,
  type: 'MAP_KEY' | 'MAP_VALUE'
}

class Map extends Node {
  // implicit keys are not wrapped
  items: Array<Comment | Alias | Scalar | MapItem>,
  type: 'MAP'
}

class SeqItem extends Node {
  indicator: '-',
  item: ContentNode | null,
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

type ContentNode =
  Comment | Alias | Scalar | Map | Seq | FlowCollection

class Directive extends Node {
  name: string,  // for YAML 1.2 should be 'TAG' or 'YAML'
  type: 'DIRECTIVE',
  +anchor: null,
  +parameters: Array<string>
  +tag: null
}

class Document extends Node {
  directives: Array<Comment | Directive>,
  contents: Array<ContentNode>,
  type: 'DOCUMENT',
  +anchor: null,
  +comment: null,
  +tag: null
}
```

In actual code, `MapItem` and `SeqItem` are implemented as `CollectionItem`, and correspondingly `Map` and `Seq` as `Collection`. Due to parsing differences, each scalar type is implemented using its own class. Additional undocumented properties are available for `Node`, but are likely only useful during parsing.
