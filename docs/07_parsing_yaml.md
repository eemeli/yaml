# Parsing YAML

<!-- prettier-ignore -->
```js
import {
  Lexer,
  Parser,
  Composer,
  LineCounter,
  tokens
} from 'yaml'
```

If you're interested only in the final output, [`parse()`](#yaml-parse) will directly produce native JavaScript
If you'd like to retain the comments and other metadata, [`parseDocument()` and `parseAllDocuments()`](#parsing-documents) will produce Document instances that allow for further processing.
If you're looking to do something more specific, this section might be for you.

Internally, the process of turning a sequence of characters into Documents relies on three stages, each of which is also exposed to external users.
First, the [Lexer](#lexer) splits the character stream into lexical tokens, i.e. sequences of characters and control codes.
Next, the [Parser](#parser) builds concrete syntax tree representations of each document and directive in the stream.
Finally, the [Composer](#composer) builds a more user-friendly and accessible [Document](#documents) representation of each document.

Both the Lexer and Parser accept incomplete input, allowing for them and the Composer to be used with e.g. [Node.js streams](https://nodejs.org/api/stream.html) or other systems that handle data in chunks.

## Lexer

<!-- prettier-ignore -->
```js
import { Lexer } from 'yaml'

const tokens = new Lexer().lex('foo: bar\nfee:\n  [24,"42"]\n')
console.dir(Array.from(tokens))
> [
    '\x02', '\x1F', 'foo',  ':',
    ' ',    '\x1F', 'bar',  '\n',
    '\x1F', 'fee',  ':',    '\n',
    '  ',   '[',    '\x1F', '24',
    ',',    '"42"', ']',    '\n'
  ]
```

#### `new Lexer()`

#### `lexer.lex(src: string, incomplete?: boolean): Generator<string>`

The API for the lexer is rather minimal, and offers no configuration.
If the input stream is chunked, the `lex()` method may be called separately for each chunk if the `incomplete` argument is `true`.
At the end of input, `lex()` should be called a final time with `incomplete: false` to ensure that the remaining tokens are emitted.

Internally, the lexer operates a state machine that determines how it parses its input.
Initially, the lexer is always in the `stream` state.
The lexer constructor and its `lex()` method should never throw an error.

All tokens are identifiable either by their exact value or their first character.
In addition to slices of the input stream, a few control characters are additionally used within the output.

| Value        | Token            | Meaning                                                                                                                  |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `\x02`       | doc-mode         | Start of a document within the default stream context.                                                                   |
| `\x18`       | flow-error-end   | Unexpected end of a flow collection, e.g. due to an unindent. Should be considered an error.                             |
| `\x1f`       | scalar           | The next token after this one is a scalar value, irrespective of its value or first character.                           |
| `\n`, `\r\n` | newline          | In certain cases (such as end of input), an empty string may also be emitted; it should also be considered as a newline. |
| `---`        | doc-start        | Explicit marker for the start of a document. Will be preceded by a doc-mode token.                                       |
| `...`        | doc-end          | Explicit marker for the end of a document.                                                                               |
| `-`          | seq-item-ind     | Block sequence item indicator, separated by whitespace.                                                                  |
| `?`          | explicit-key-ind | Explicit block map key indicator, separated by whitespace.                                                               |
| `:`          | map-value-ind    | Block map value indicator.                                                                                               |
| `{`          | flow-map-start   |                                                                                                                          |
| `}`          | flow-map-end     |                                                                                                                          |
| `[`          | flow-seq-start   |                                                                                                                          |
| `]`          | flow-seq-end     |                                                                                                                          |
| `,`          | comma            | Separator between flow collection items.                                                                                 |
| `\u{FEFF}`   | byte-order-mark  | Treated as whitespace in stream & content in a document.                                                                 |

If any of the control characters do show up directly in the input stream, they will be treated normally, and even when bare will be preceded by a SCALAR control token in the output.

All remaining tokens are identifiable by their first character:

| First char | Token                | Meaning                                                                                                           |
| ---------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ` `, `\t`  | space                | Only contains space characters if token indicates indentation. Otherwise may contain repeats of either character. |
| `#`        | comment              | Separated from preceding by whitespace. Does not include the trailing newline.                                    |
| `%`        | directive-line       | Only produced in a stream context.                                                                                |
| `*`        | alias                |                                                                                                                   |
| `&`        | anchor               |                                                                                                                   |
| `!`        | tag                  |                                                                                                                   |
| `'`        | single-quoted-scalar | Should also include `'` as a last character, if input is valid.                                                   |
| `"`        | double-quoted-scalar | Should also include `"` as a last character, if input is valid.                                                   |
| `⎮`, `>`   | block-scalar-header  | Expected to be followed by optional whitespace & comment, a newline, and then a scalar value.                     |

## Parser

<!-- prettier-ignore -->
```js
import { Parser } from 'yaml'

for (const token of new Parser().parse('foo: [24,"42"]\n'))
  console.dir(token, { depth: null })

> {
    type: 'document',
    offset: 0,
    start: [],
    value: {
      type: 'block-map',
      offset: 0,
      indent: 0,
      items: [
        {
          start: [],
          key: { type: 'scalar', offset: 0, indent: 0, source: 'foo' },
          sep: [
            { type: 'map-value-ind', offset: 3, indent: 0, source: ':' },
            { type: 'space', offset: 4, indent: 0, source: ' ' }
          ],
          value: {
            type: 'flow-collection',
            offset: 5,
            indent: 0,
            start: { type: 'flow-seq-start', offset: 5, indent: 0, source: '[' },
            items: [
              { type: 'scalar', offset: 6, indent: 0, source: '24' },
              { type: 'comma', offset: 8, indent: 0, source: ',' },
              {
                type: 'double-quoted-scalar',
                offset: 9,
                indent: 0,
                source: '"42"'
              }
            ],
            end: [
              { type: 'flow-seq-end', offset: 13, indent: 0, source: ']' },
              { type: 'newline', offset: 14, indent: 0, source: '\n' }
            ]
          }
        }
      ]
    }
  }
```

The parser by default uses an internal Lexer instance, and provides a similarly minimal API for producing a [Concrete Syntax Tree](https://en.wikipedia.org/wiki/Concrete_syntax_tree) representation of the input stream.

The tokens emitted by the parser are JavaScript objects, each of which has a `type` value that's one of the following: `directive-line`, `document`, `byte-order-mark`, `space`, `comment`, `newline`.
Of these, only `directive-line` and `document` should be considered as content.

The parser does not validate its output, trying instead to produce a most YAML-ish representation of any input.
It should never throw errors, but may (rarely) include error tokens in its output.

To validate a CST, you will need to compose it into a `Document`.
If the document contains errors, they will be included in the document's `errors` array, and each error will will contain an `offset` within the source string, which you may then use to find the corresponding node in the CST.

#### `new Parser(onNewLine?: (offset: number) => void)`

Create a new parser.
If defined, `onNewLine` is called separately with the start position of each new line (in `parse()`, including the start of input).

#### `parser.parse(source: string, incomplete = false): Generator<Token, void>`

Parse `source` as a YAML stream, generating tokens for each directive, document and other structure as it is completely parsed.
If `incomplete`, a part of the last line may be left as a buffer for the next call.

Errors are not thrown, but are yielded as `{ type: 'error', offset, message }` tokens.

#### `parser.next(lexToken: string): Generator<Token, void>`

Advance the parser by one lexical token.
Used internally by `parser.parse()`; exposed to allow for use with an external lexer.

For debug purposes, if the `LOG_TOKENS` env var is true-ish, all lexical tokens will be pretty-printed using `console.log()` as they are being processed.

### CST Nodes

For a complete description of CST node interfaces, please consult the [tokens.ts source](https://github.com/eemeli/yaml/blob/master/src/parse/tokens.ts).

Some of the most common node properties include:

| Property              | Type            | Description                                                                                                                                   |
| --------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                | `string`        | The only node property that's always defined. Identifies the node type. May be used as a TS type guard.                                       |
| `offset`              | `number`        | The start index within the source string or character stream.                                                                                 |
| `source`              | `string`        | A raw string representation of the node's value, including all newlines and indentation.                                                      |
| `indent`              | `number`        | The indent level of the current line; mostly just for internal use.                                                                           |
| `items`               | `Item[]`        | The contents of a collection; exact shape depends on the collection type.                                                                     |
| `start`, `sep`, `end` | `SourceToken[]` | Content before, within, and after "actual" values. Includes item and collection indicators, anchors, tags, comments, as well as other things. |

Collection items contain some subset of the following properties:

| Item property | Type            | Description                                                                                                                |
| ------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `start`       | `SourceToken[]` | Always defined. Content before the actual value. May include comments that are later assigned to the preceding item.       |
| `key`         | `Token ⎮ null`  | Set for key/value pairs only, so never used in block sequences.                                                            |
| `sep`         | `SourceToken[]` | Content between the key and the value. If defined, indicates that the `key` logically exists, even if its value is `null`. |
| `value`       | `Token ⎮ null`  | The value. Normally set, but may be left out for e.g. explicit keys with no matching value.                                |

### Counting Lines

```js
import { LineCounter, Parser } from 'yaml'

const lineCounter = new LineCounter()
const parser = new Parser(lineCounter.addNewLine))
const tokens = parser.parse('foo:\n- 24\n- "42"\n')
Array.from(tokens) // forces iteration

lineCounter.lineStarts
> [ 0, 5, 10, 17 ]
lineCounter.linePos(3)
> { line: 1, col: 4 }
lineCounter.linePos(5)
> { line: 2, col: 1 }
```

#### `new LineCounter()`

Tracks newlines during parsing in order to provide an efficient API for determining the one-indexed `{ line, col }` position for any offset within the input.

#### `lineCounter.addNewLine(offset: number)`

Adds the starting index of a new line.
Should be called in order, or the internal `lineStarts` array will need to be sorted before calling `linePos()`.
Bound to the instance, so may be used directly as a callback.

#### `lineCounter.linePos(offset: number): { line: number, col: number }`

Performs a binary search and returns the 1-indexed `{ line, col }` position of `offset`.
If `line === 0`, `addNewLine` has never been called or `offset` is before the first known newline.

## Composer

<!-- prettier-ignore -->
```js
import { Composer, Parser } from 'yaml'

const src = 'foo: bar\nfee: [24, "42"]'
const docs = []
const composer = new Composer(doc => docs.push(doc))
for (const token of new Parser().parse(src)) composer.next(token)
composer.end()

docs.map(doc => doc.toJS())
> [{ foo: 'bar', fee: [24, '42'] }]
```

#### `new Composer(push: (doc: Document.Parsed) => void, options?: Options)`

Create a new Document composer.
Does not include an internal Parser instance, so an external one will be needed.
`options` will be used during composition, and passed to the `new Document` constructor; may include any of ParseOptions, DocumentOptions, and SchemaOptions.

#### `composer.next(token: Token)`

Advance the composed by one CST token.
Bound to the Composer instance, so may be used directly as a callback function.

#### `composer.end(forceDoc?: boolean, offset?: number)`

Always call at end of input to push out any remaining document.
If `forceDoc` is true and the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
`offset` should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.

#### `composer.streamInfo(): { comment, directives, errors, warnings }`

Current stream status information.
Mostly useful at the end of input for an empty stream.
