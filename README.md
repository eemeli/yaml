# YAML

JavaScript parser and stringifier for [YAML 1.2](http://yaml.org/)

Note: `yaml` 0.x and 1.x are rather different implementations. For the earlier `yaml`, see [tj/js-yaml](https://github.com/tj/js-yaml).


## Usage

```
npm install yaml@next
```

```js
import { resolve } from 'yaml'

const yaml =
`YAML:
  - A human-readable data serialization language
  - https://en.wikipedia.org/wiki/YAML
yaml:
  - A complete JavaScript implementation
  - https://www.npmjs.com/package/yaml
`

const doc = resolve(yaml)[0]

doc.toJSON()
/*
 *  { YAML:
 *    [ 'A human-readable data serialization language',
 *      'https://en.wikipedia.org/wiki/YAML' ],
 *    yaml:
 *    [ 'A complete JavaScript implementation',
 *      'https://www.npmjs.com/package/yaml' ] }
*/

doc.toString() === yaml
```


## Beta Progress

The reason why this project exists is to have a tool that's capable of properly generating and handling YAML files with comments, specifically to provide context for translation strings that have been lifted out of JS source code. We're not there quite yet, as the prerequisite for that is having a complete and functioning YAML library.


### What Works So Far

#### Parsing
- Support for all YAML node types, including alias nodes and multi-document streams
- Complete support for the Fallback, JSON, and Core [Schemas], as well as an "extended" schema that covers all of the YAML 1.1 scalar [types] except for `!!yaml`.
- `YAML.parse` converts string input to native JavaScript values
- Comments are parsed and included in the outputs of `YAML.parseAST` ([lower-level AST] of the input) and `YAML.parseStream` (array of `Document` objects with `Map`/`Seq`/`Scalar` contents). These functions should never throw, but include arrays of `errors` and `warnings`.
- Support for `<<` merge keys (default-disabled, enable with `merge: true` option)
- Complete match between the parsed `in.yaml`, `in.json`, `out.yaml`, and `error` files across all of the [yaml-test-suite] test cases (note: A few of the tests are not in agreement with the spec, so this requires the use of a [custom branch] until the relevant [pull requests] and [issues] are resolved)
- "Native" `Map` and `Seq` collections have `toJSON()` methods for bare JavaScript `Object` and `Array` output
- Any string input should be accepted, and produce some output. Errors (if any) are not thrown, but included in the document's `errors` array

[Schemas]: http://www.yaml.org/spec/1.2/spec.html#Schema
[types]: http://yaml.org/type/
[yaml-test-suite]: https://github.com/yaml/yaml-test-suite
[custom branch]: https://github.com/eemeli/yaml-test-suite/tree/fixed-data
[pull requests]: https://github.com/yaml/yaml-test-suite/pulls/eemeli
[issues]: https://github.com/yaml/yaml-test-suite/issues/created_by/eemeli
[lower-level AST]: src/ast/README.md

#### Creating
- `new YAML.Document()` does not need any arguments to create new documents, which may then have their `#contents` set to any type
- `Document#resolveValue(value)` wraps values in `yaml` objects, deeply mapping arrays to `Seq`, objects to `Map`, and everything else to `Scalar`
- Comments can be attached on or before any `Seq`, `Map` and `Scalar`

#### Stringifying
- `Document#toString()` produces idempotent YAML from all non-error spec examples and test suite cases
- `AST#toString()` works completely, but is clumsy to use


### Still Needs Work

- Long lines should be wrapped
- Collections need to retain tag data
- Item add/remove should keep tags in place
- Explicit tags are not included in the stringified output
- API needs finalising
- Better documentation
