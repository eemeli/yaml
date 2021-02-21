// To test types, compile this file with tsc

import { Document, parse, parseDocument, stringify, visit } from '../src/index'
import { YAMLMap, YAMLSeq, Pair, Scalar } from '../src/types'

parse('3.14159')
// 3.14159

parse('[ true, false, maybe, null ]\n', { version: '1.2' })
// [ true, false, 'maybe', null ]

const file = `# file.yml
YAML:
  - A human-readable data serialization language
  - https://en.wikipedia.org/wiki/YAML
yaml:
  - A complete JavaScript implementation
  - https://www.npmjs.com/package/yaml`
parse(file, (key, value) => value)
// { YAML:
//   [ 'A human-readable data serialization language',
//     'https://en.wikipedia.org/wiki/YAML' ],
//   yaml:
//   [ 'A complete JavaScript implementation',
//     'https://www.npmjs.com/package/yaml' ] }

stringify(3.14159)
// '3.14159\n'

stringify([true, false, 'maybe', null], { version: '1.2' })
// `- true
// - false
// - maybe
// - null
// `

stringify(
  { number: 3, plain: 'string', block: 'two\nlines\n' },
  (key, value) => value
)
// `number: 3
// plain: string
// block: >
//   two
//
//   lines
// `

const src = '[{ a: A }, { b: B }]'
const doc = parseDocument(src)
const seq = doc.contents as YAMLSeq
const { anchors } = doc
const [a, b] = seq.items as YAMLMap.Parsed[]
anchors.setAnchor(a.items[0].value) // 'a1'
anchors.setAnchor(b.items[0].value) // 'a2'
anchors.setAnchor(null, 'a1') // 'a1'
anchors.getName(a) // undefined
anchors.getNode('a2')
// { value: 'B', range: [ 16, 18 ], type: 'PLAIN' }
String(doc)
// [ { a: A }, { b: &a2 B } ]

const alias = anchors.createAlias(a, 'AA')
seq.items.push(alias)
const refs = new Map()
doc.toJS({ onAnchor: (value, count) => refs.set(value, count) })
// [ { a: 'A' }, { b: 'B' }, { a: 'A' } ]
String(doc)
// [ &AA { a: A }, { b: &a2 B }, *AA ]
refs
// Map(3) { undefined => 1, 'B' => 1, { a: 'A' } => 2 }

const merge = anchors.createMergePair(alias)
b.items.push(merge)
doc.toJS()
// [ { a: 'A' }, { b: 'B', a: 'A' }, { a: 'A' } ]
String(doc)
// [ &AA { a: A }, { b: &a2 B, <<: *AA }, *AA ]

// This creates a circular reference
merge.value.items.push(anchors.createAlias(b))
doc.toJS() // [RangeError: Maximum call stack size exceeded]
String(doc)
// [
//   &AA { a: A },
//   &a3 {
//       b: &a2 B,
//       <<:
//         [ *AA, *a3 ]
//     },
//   *AA
// ]

const mod: Document = doc
const map = new YAMLMap()
map.items.push(new Pair('foo', 'bar'))
mod.contents = map

const doc2 = new Document({ bizz: 'fuzz' })
doc2.add(doc2.createPair('baz', 42))

visit(doc, (key, node, path) => console.log(key, node, path))
visit(doc, {
  Scalar(key, node) {
    if (key === 3) return 5
    if (typeof node.value === 'number') return doc.createNode(node.value + 1)
  },
  Map(_, map) {
    if (map.items.length > 3) return visit.SKIP
  },
  Pair(_, pair) {
    if (pair.key instanceof Scalar && pair.key.value === 'foo')
      return visit.REMOVE
  },
  Seq(_, seq) {
    if (seq.items.length > 3) return visit.BREAK
  }
})
