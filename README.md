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

The [AST level] of the library has been released separately, and is fully functional.


### What Works So Far

#### Parsing
- Support for all YAML node types, including alias nodes and multi-document streams
- Complete support for the Fallback, JSON, and Core [Schemas], as well as an "extended" schema that covers all of the YAML 1.1 scalar [types] except for `!!yaml`.
- Support for `<<` merge keys (default-disabled, enable with `merge: true` option)
- Complete match between the parsed `in.yaml`, `in.json`, and `out.yaml` files across all of the [yaml-test-suite] test cases (note: A few of the tests are not in agreement with the spec, so this requires the use of a [custom branch] until the relevant [pull requests] and [issues] are resolved)
- Comments are parsed and included up to the [AST level] of the API
- "Native" `Map` and `Seq` collections have `toJSON()` methods for bare JavaScript `Object` and `Array` output
- Any string input should be accepted, and produce some output. Errors (if any) are not thrown, but included in the document's `errors` array

[Schemas]: http://www.yaml.org/spec/1.2/spec.html#Schema
[types]: http://yaml.org/type/
[yaml-test-suite]: https://github.com/yaml/yaml-test-suite
[custom branch]: https://github.com/eemeli/yaml-test-suite/tree/fixed-data
[pull requests]: https://github.com/yaml/yaml-test-suite/pulls/eemeli
[issues]: https://github.com/yaml/yaml-test-suite/issues/created_by/eemeli
[AST level]: https://www.npmjs.com/package/raw-yaml

#### Stringifying
- `Document#toString()` produces idempotent YAML from all non-error spec examples and test suite cases
- `AST#toString()` works completely, but is clumsy to use


### Still Needs Work

- Object creation: `Document`, `Map` and `Seq` need constructors accepting plain JS objects
- Long lines should be wrapped
- Collections need to retain tag and comment data
- Item add/remove should keep tags and comments in place
- Explicit tags are not included in the stringified output
- Not all parser errors are reported
- API needs finalising
- Better documentation
