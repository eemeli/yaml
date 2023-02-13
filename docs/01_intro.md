# YAML

> To install:

```sh
npm install yaml
# or
yarn add yaml
```

> To use:

```js
import { parse, stringify } from 'yaml'
// or
import YAML from 'yaml'
// or
const YAML = require('yaml')
```

`yaml` is a definitive library for [YAML](http://yaml.org/), the human friendly data serialization standard.
This library:

- Supports both YAML 1.1 and YAML 1.2 and all common data schemas,
- Passes all of the [yaml-test-suite](https://github.com/yaml/yaml-test-suite) tests,
- Can accept any string as input without throwing, parsing as much YAML out of it as it can, and
- Supports parsing, modifying, and writing YAML comments and blank lines.

The library is released under the ISC open source license, and the code is [available on GitHub](https://github.com/eemeli/yaml/).
It has no external dependencies and runs on Node.js as well as modern browsers.

For the purposes of versioning, any changes that break any of the endpoints or APIs documented here will be considered semver-major breaking changes.
Undocumented library internals may change between minor versions, and previous APIs may be deprecated (but not removed).

The minimum supported TypeScript version of the included typings is 3.9;
for use in earlier versions you may need to set `skipLibCheck: true` in your config.
This requirement may be updated between minor versions of the library.

**Note:** These docs are for `yaml@2`. For v1, see the [v1.10.0 tag](https://github.com/eemeli/yaml/tree/v1.10.0) for the source and [eemeli.org/yaml/v1](https://eemeli.org/yaml/v1/) for the documentation.

## API Overview

The API provided by `yaml` has three layers, depending on how deep you need to go: [Parse & Stringify](#parse-amp-stringify), [Documents](#documents), and the underlying [Lexer/Parser/Composer](#parsing-yaml).
The first has the simplest API and "just works", the second gets you all the bells and whistles supported by the library along with a decent [AST](#content-nodes), and the third lets you get progressively closer to YAML source, if that's your thing.

<h3>Parse & Stringify</h3>

```js
import { parse, stringify } from 'yaml'
```

- [`parse(str, reviver?, options?): value`](#yaml-parse)
- [`stringify(value, replacer?, options?): string`](#yaml-stringify)

<h3>Documents</h3>

<!-- prettier-ignore -->
```js
import {
  Document,
  isDocument,
  parseAllDocuments,
  parseDocument
} from 'yaml'
```

- [`Document`](#documents)
  - [`constructor(value, replacer?, options?)`](#creating-documents)
  - [`#contents`](#content-nodes)
  - [`#directives`](#stream-directives)
  - [`#errors`](#errors)
  - [`#warnings`](#errors)
- [`parseAllDocuments(str, options?): Document[]`](#parsing-documents)
- [`parseDocument(str, options?): Document`](#parsing-documents)

<h3>Content Nodes</h3>

<!-- prettier-ignore -->
```js
import {
  isAlias, isCollection, isMap, isNode,
  isPair, isScalar, isSeq, Scalar,
  visit, visitAsync, YAMLMap, YAMLSeq
} from 'yaml'
```

- [`isNode(foo): boolean`](#identifying-nodes)
- [`new Scalar(value)`](#scalar-values)
- [`new YAMLMap()`](#collections)
- [`new YAMLSeq()`](#collections)
- [`doc.createAlias(node, name?): Alias`](#creating-nodes)
- [`doc.createNode(value, options?): Node`](#creating-nodes)
- [`doc.createPair(key, value): Pair`](#creating-nodes)
- [`visit(node, visitor)`](#modifying-nodes)
- [`visitAsync(node, visitor)`](#modifying-nodes)

<h3>Parsing YAML</h3>

```js
import { Composer, Lexer, Parser } from 'yaml'
```

- [`new Lexer().lex(src)`](#lexer)
- [`new Parser(onNewLine?).parse(src)`](#parser)
- [`new Composer(options?).compose(tokens)`](#composer)
