# raw-yaml
### Read anything as YAML

A maximally liberal [YAML 1.2] parser:
- Will do its best to turn any string input into a YAML-ish AST representation
- Fully supports programmatic handling of YAML comments and multi-document streams
- Does practically no error checking, and should never throw -- but if you feed it garbage, you'll likely get a garbage AST as well
- Has no runtime dependencies and compresses to under 9Kb
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
import parseYAML from 'raw-yaml'

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

const ast = parseYAML(str)

ast[0]            // the first document, which contains a map with two keys
  .contents[0]    // the contents (as opposed to directives) of the document
  .items[3].item  // the last item, a flow map
  .items[3]       // the third token, parsed as a plain value
  .rawValue       // 'blue'

ast[1]            // the second document, which contains a sequence
  .contents[0]    // the contents (as opposed to directives) of the document
  .items[1].item  // the second item, a block value
  .rawValue       // ' Block scalar\n'
```

### `parseYAML(str: string): Array<Document>`

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

Each node in the AST extends a common ancestor `Node`:

```js
class Range {
  start: number,            // offset of first character
  end: number,              // offset after last character
  get isEmpty(): boolean    // true if end is not greater than start
}

class Node {
  context: {
    atLineStart: boolean,   // is this node the first one on this line
    indent: number,         // the current level of indentation (may be -1)
    src: string             // the full original source
  },
  error: ?Error,            // if not null, indicates a parser failure
  props: Array<Range>,      // anchors, tags and comments
  range: Range,             // span of context.src parsed into this node
  type:                     // specific node type
    'ALIAS' | 'BLOCK_FOLDED' | 'BLOCK_LITERAL' | 'COLLECTION' | 'COMMENT' |
    'DIRECTIVE' | 'DOCUMENT' | 'FLOW_MAP' | 'FLOW_SEQ' | 'MAP_KEY' |
    'MAP_VALUE' | 'PLAIN' | 'QUOTE_DOUBLE' | 'QUOTE_SINGLE' | 'SEQ_ITEM',
  value: ?string            // if non-null, overrides string value
  get anchor(): ?string,    // this node's anchor, if set
  get comment(): ?string,   // this node's newline-delimited comment(s), if any
  get rawValue(): ?string,  // an unprocessed slice of context.src determining
                            //   this node's value
  get tag(): ?string,       // this node's tag, if set
  toString(): string        // a YAML string representation of this node
}

class BlockValue extends Node {
  blockStyle: string,       // matches the regexp `[|>][-+1-9]*`
  type: 'BLOCK_FOLDED' | 'BLOCK_LITERAL'
}

class Comment extends Node {
  type: 'COMMENT',          // PLAIN nodes may also turn out to be comment-only
  get anchor(): null,
  get comment(): string,
  get rawValue(): null,
  get tag(): null
}

class CollectionItem extends Node {
  indicator: '?' | ':' | '-',
  item: ?Node,
  type: 'MAP_KEY' | 'MAP_VALUE' | 'SEQ_ITEM'
}

class Collection extends Node {
  items: Array<Node>,       // in addition to CollectionItem, may include
                            //   implicit keys of nearly any type
  type: 'COLLECTION'
}

class FlowCollection extends Node {
  // may contains nodes with type:
  //   ALIAS, COMMENT, FLOW_MAP, FLOW_SEQ, PLAIN, QUOTE_DOUBLE, or QUOTE_SINGLE
  items: Array<'{' | '}' | '[' | ']' | ',' | '?' | ':' | Node>,
  type: 'FLOW_MAP' | 'FLOW_SEQ'
}

class Directive extends Node {
  type: 'DIRECTIVE',
  get anchor(): null,
  get tag(): null
}

class Document extends Node {
  directives: Array<Comment | Directive>,
  contents: Array<Node>,
  type: 'DOCUMENT',
  get anchor(): null,
  get comment(): null,
  get tag(): null
}
```
