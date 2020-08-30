# Parse & Stringify

```yaml
# file.yml
YAML:
  - A human-readable data serialization language
  - https://en.wikipedia.org/wiki/YAML
yaml:
  - A complete JavaScript implementation
  - https://www.npmjs.com/package/yaml
```

At its simplest, you can use `YAML.parse(str)` and `YAML.stringify(value)` just as you'd use `JSON.parse(str)` and `JSON.stringify(value)`. If that's enough for you, everything else in these docs is really just implementation details.

## YAML.parse

```js
import fs from 'fs'
import YAML from 'yaml'

YAML.parse('3.14159')
// 3.14159

YAML.parse('[ true, false, maybe, null ]\n')
// [ true, false, 'maybe', null ]

const file = fs.readFileSync('./file.yml', 'utf8')
YAML.parse(file)
// { YAML:
//   [ 'A human-readable data serialization language',
//     'https://en.wikipedia.org/wiki/YAML' ],
//   yaml:
//   [ 'A complete JavaScript implementation',
//     'https://www.npmjs.com/package/yaml' ] }
```

#### `YAML.parse(str, reviver?, options = {}): any`

`str` should be a string with YAML formatting. If defined, the `reviver` function follows the [JSON implementation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Using_the_reviver_parameter). See [Options](#options) for more information on the last argument, an optional configuration object.

The returned value will match the type of the root value of the parsed YAML document, so Maps become objects, Sequences arrays, and scalars result in nulls, booleans, numbers and strings.

`YAML.parse` may throw on error, and it may log warnings using `console.warn`. It only supports input consisting of a single YAML document; for multi-document support you should use [`YAML.parseAllDocuments`](#parsing-documents).

## YAML.stringify

```js
YAML.stringify(3.14159)
// '3.14159\n'

YAML.stringify([true, false, 'maybe', null])
// `- true
// - false
// - maybe
// - null
// `

YAML.stringify({ number: 3, plain: 'string', block: 'two\nlines\n' })
// `number: 3
// plain: string
// block: >
//   two
//
//   lines
// `
```

#### `YAML.stringify(value, replacer?, options = {}): string`

`value` can be of any type. The returned string will always include `\n` as the last character, as is expected of YAML documents. If defined, the `replacer` array or function follows the [JSON implementation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter). See [Options](#options) for more information on the last argument, an optional configuration object. For JSON compatibility, using a number or a string as the `options` value will set the `indent` option accordingly.

As strings in particular may be represented in a number of different styles, the simplest option for the value in question will always be chosen, depending mostly on the presence of escaped or control characters and leading & trailing whitespace.

To create a stream of documents, you may call `YAML.stringify` separately for each document's `value`, and concatenate the documents with the string `...\n` as a separator.
