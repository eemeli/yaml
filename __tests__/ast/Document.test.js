import Document from '../../src/ast/Document'
import Node from '../../src/ast/Node'
import parseNode from '../../src/ast/parseNode'

const spec = {
  prefix: {
    src:
`\t# Comment
# lines
Document`,
    result: {
      contents: [
        { comment: ' Comment' },
        { comment: ' lines' },
        'Document'
      ]
    }
  },
  markers: {
    src:
`%YAML 1.2
---
Document
... # Suffix`,
    tgt: {
      directives: ['YAML 1.2'],
      contents: ['Document']
    }
  },
  bare: {
    src:
`Bare
document
...
# No document
...
|
%!PS-Adobe-2.0 # Not the first line`,
    tgt: {
      contents: ['Bare\ndocument']
    }
  },
  explicit: {
    src:
`---
{ matches
% : 20 }
...
---
# Empty
...`,
    tgt: {
      contents: [
        { items: ['{', 'matches\n%', ':', '20', '}'] }
      ]
    }
  },
  directives: {
    src:
`%YAML 1.2
--- |
%!PS-Adobe-2.0
...
%YAML1.2
---
# Empty
...`,
    tgt: {
      directives: ['YAML 1.2'],
      contents: ['%!PS-Adobe-2.0\n']
    }
  },
  stream: {
    src:
`Document
---
# Empty
...
%YAML 1.2
---
matches %: 20`,
    tgt: {
      contents: ['Document']
    }
  }
}

const testSpec = (res, exp) => {
  if (typeof exp === 'string') {
    const value = res instanceof Node ? res.rawValue : res
    expect(value).toBe(exp)
  } else if (Array.isArray(exp)) {
    expect(res).toBeInstanceOf(Array)
    exp.forEach((e, i) => testSpec(res[i], e))
  } else {
    expect(res).toBeInstanceOf(Object)
    for (const key in exp) testSpec(res[key], exp[key])
  }
}

describe('spec', () => {
  for (const name in spec) {
    test(name, () => {
      const { src, tgt } = spec[name]
      const doc = new Document({ type: Node.Type.DOCUMENT })
      const context = {
        indent: 0,
        inFlow: false,
        inCollection: false,
        parseNode,
        src
      }
      const end = doc.parse(context, 0)
      testSpec(doc, tgt)
    })
  }
})
