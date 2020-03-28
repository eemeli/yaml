# YAML

> To install:

```sh
npm install yaml
# or
yarn add yaml
```

`yaml` is a new definitive library for [YAML](http://yaml.org/), a human friendly data serialization standard. This library:

- Supports all versions of the standard (1.0, 1.1, and 1.2),
- Passes all of the [yaml-test-suite](https://github.com/yaml/yaml-test-suite) tests,
- Can accept any string as input without throwing, parsing as much YAML out of it as it can, and
- Supports parsing, modifying, and writing YAML comments.

The library is released under the ISC open source license, and the code is [available on GitHub](https://github.com/eemeli/yaml/). It runs on Node.js 6 and later with no external dependencies, and in browsers from IE 11 upwards (Note: `@babel/runtime` is used only by the `"browser"` entry point).

For the purposes of versioning, any changes that break any of the endpoints or APIs documented here will be considered semver-major breaking changes. Undocumented library internals may change between minor versions, and previous APIs may be deprecated (but not removed).

## API Overview

The API provided by `yaml` has three layers, depending on how deep you need to go: [Parse & Stringify](#parse-amp-stringify), [Documents](#documents), and the [CST Parser](#cst-parser). The first has the simplest API and "just works", the second gets you all the bells and whistles supported by the library along with a decent [AST](#content-nodes), and the third is the closest to YAML source, making it fast, raw, and crude.

<h3>Parse & Stringify</h3>

```js
import YAML from 'yaml'
// or
const YAML = require('yaml')
```

- [`YAML.parse(str, options): value`](#yaml-parse)
- [`YAML.stringify(value, options): string`](#yaml-stringify)

<h3>Documents</h3>

- [`YAML.createNode(value, wrapScalars, tag): Node`](#creating-nodes)
- [`YAML.defaultOptions`](#options)
- [`YAML.Document`](#documents)
  - [`constructor(options)`](#creating-documents)
  - [`defaults`](#options)
  - [`#anchors`](#working-with-anchors)
  - [`#contents`](#content-nodes)
  - [`#errors`](#errors)
- [`YAML.parseAllDocuments(str, options): YAML.Document[]`](#parsing-documents)
- [`YAML.parseDocument(str, options): YAML.Document`](#parsing-documents)

```js
import { Pair, YAMLMap, YAMLSeq } from 'yaml/types'
```

- [`new Pair(key, value)`](#creating-nodes)
- [`new YAMLMap()`](#creating-nodes)
- [`new YAMLSeq()`](#creating-nodes)

<h3>CST Parser</h3>

```js
import parseCST from 'yaml/parse-cst'
```

- [`parseCST(str): CSTDocument[]`](#parsecst)
- [`YAML.parseCST(str): CSTDocument[]`](#parsecst)
