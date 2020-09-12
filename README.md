# YAML <a href="https://www.npmjs.com/package/yaml"><img align="right" src="https://badge.fury.io/js/yaml.svg" title="npm package" /></a>

`yaml` is a JavaScript parser and stringifier for [YAML](http://yaml.org/), a human friendly data serialization standard. It supports both parsing and stringifying data using all versions of YAML, along with all common data schemas. As a particularly distinguishing feature, `yaml` fully supports reading and writing comments and blank lines in YAML documents.

The library is released under the ISC open source license, and the code is [available on GitHub](https://github.com/eemeli/yaml/). It has no external dependencies and runs on Node.js 6 and later, and in browsers from IE 11 upwards.

For the purposes of versioning, any changes that break any of the endpoints or APIs documented here will be considered semver-major breaking changes. Undocumented library internals may change between minor versions, and previous APIs may be deprecated (but not removed).

For more information, see the project's documentation site: [**eemeli.org/yaml**](https://eemeli.org/yaml/)

To install:

```sh
npm install yaml@next
```

**Note:** These docs are for `yaml@2`. For v1, see the [v1.10.0 tag](https://github.com/eemeli/yaml/tree/v1.10.0) for the source and [eemeli.org/yaml/v1](https://eemeli.org/yaml/v1/) for the documentation.

## API Overview

The API provided by `yaml` has three layers, depending on how deep you need to go: [Parse & Stringify](https://eemeli.org/yaml/#parse-amp-stringify), [Documents](https://eemeli.org/yaml/#documents), and the [CST Parser](https://eemeli.org/yaml/#cst-parser). The first has the simplest API and "just works", the second gets you all the bells and whistles supported by the library along with a decent [AST](https://eemeli.org/yaml/#content-nodes), and the third is the closest to YAML source, making it fast, raw, and crude.

```js
import YAML from 'yaml'
// or
const YAML = require('yaml')
```

### Parse & Stringify

- [`YAML.parse(str, reviver?, options?): value`](https://eemeli.org/yaml/#yaml-parse)
- [`YAML.stringify(value, replacer?, options?): string`](https://eemeli.org/yaml/#yaml-stringify)

### YAML Documents

- [`YAML.defaultOptions`](https://eemeli.org/yaml/#options)
- [`YAML.Document`](https://eemeli.org/yaml/#yaml-documents)
  - [`constructor(value, replacer?, options?)`](https://eemeli.org/yaml/#creating-documents)
  - [`defaults`](https://eemeli.org/yaml/#options)
  - [`#createNode(value, options?): Node`](https://eemeli.org/yaml/#creating-nodes)
  - [`#anchors`](https://eemeli.org/yaml/#working-with-anchors)
  - [`#contents`](https://eemeli.org/yaml/#content-nodes)
  - [`#errors`](https://eemeli.org/yaml/#errors)
- [`YAML.parseAllDocuments(str, options?): YAML.Document[]`](https://eemeli.org/yaml/#parsing-documents)
- [`YAML.parseDocument(str, options?): YAML.Document`](https://eemeli.org/yaml/#parsing-documents)

```js
import { Pair, YAMLMap, YAMLSeq } from 'yaml/types'
```

- [`new Pair(key, value)`](https://eemeli.org/yaml/#creating-nodes)
- [`new YAMLMap()`](https://eemeli.org/yaml/#creating-nodes)
- [`new YAMLSeq()`](https://eemeli.org/yaml/#creating-nodes)

### CST Parser

```js
import parseCST from 'yaml/parse-cst'
```

- [`parseCST(str): CSTDocument[]`](https://eemeli.org/yaml/#parsecst)
- [`YAML.parseCST(str): CSTDocument[]`](https://eemeli.org/yaml/#parsecst)

## YAML.parse

```yaml
# file.yml
YAML:
  - A human-readable data serialization language
  - https://en.wikipedia.org/wiki/YAML
yaml:
  - A complete JavaScript implementation
  - https://www.npmjs.com/package/yaml
```

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

## YAML.stringify

```js
import YAML from 'yaml'

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
// block: |
//   two
//   lines
// `
```

---

Browser testing provided by:

<a href="https://www.browserstack.com/open-source">
<img width=200 src="https://eemeli.org/yaml/images/browserstack.svg" />
</a>
