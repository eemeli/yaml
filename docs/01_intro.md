# YAML

> To install:

```sh
npm install yaml@next
# or
yarn add yaml@next
```

`yaml` is a new definitive library for [YAML](http://yaml.org/), a human friendly data serialization standard. This library:

- Supports all versions of the standard (1.0, 1.1, and 1.2),
- Passes all of the [yaml-test-suite](https://github.com/yaml/yaml-test-suite) tests,
- Can accept any string as input without throwing, parsing as much YAML out of it as it can, and
- Supports parsing, modifying, and writing YAML comments.

The library is released under the ISC open source license, and the code is [available on GitHub](https://github.com/eemeli/yaml/). It has no external dependencies and runs on Node.js 6 and later, and in browsers from IE 11 upwards.

For the purposes of versioning, any changes that break any of the endpoints or APIs documented here will be considered semver-major breaking changes. Undocumented library internals may change between minor versions, and previous APIs may be deprecated (but not removed).

**Note:** These docs are for `yaml@2`. For v1, see the [v1.10.0 tag](https://github.com/eemeli/yaml/tree/v1.10.0) for the source and [eemeli.org/yaml/v1](https://eemeli.org/yaml/v1/) for the documentation.

## API Overview

The API provided by `yaml` has three layers, depending on how deep you need to go: [Parse & Stringify](#parse-amp-stringify), [Documents](#documents), and the [CST Parser](#cst-parser). The first has the simplest API and "just works", the second gets you all the bells and whistles supported by the library along with a decent [AST](#content-nodes), and the third is the closest to YAML source, making it fast, raw, and crude.

<h3>Parse & Stringify</h3>

```js
import YAML from 'yaml'
// or
const YAML = require('yaml')
```

- [`YAML.parse(str, reviver?, options?): value`](#yaml-parse)
- [`YAML.stringify(value, replacer?, options?): string`](#yaml-stringify)

<h3>Documents</h3>

- [`YAML.defaultOptions`](#options)
- [`YAML.Document`](#documents)
  - [`constructor(value, replacer?, options?)`](#creating-documents)
  - [`defaults`](#options)
  - [`#createNode(value, options?): Node`](#creating-nodes)
  - [`#anchors`](#working-with-anchors)
  - [`#contents`](#content-nodes)
  - [`#errors`](#errors)
- [`YAML.parseAllDocuments(str, options?): YAML.Document[]`](#parsing-documents)
- [`YAML.parseDocument(str, options?): YAML.Document`](#parsing-documents)

```js
import { Pair, YAMLMap, YAMLSeq } from 'yaml/types'
```

- [`new Pair(key, value)`](#creating-nodes)
- [`new YAMLMap()`](#creating-nodes)
- [`new YAMLSeq()`](#creating-nodes)

<h3>CST Parser</h3>

- [`YAML.parseCST(str): CSTDocument[]`](#parsecst)
