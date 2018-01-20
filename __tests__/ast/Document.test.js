import Node from '../../src/ast/Node'
import parseStream from '../../src/ast/parseStream';

const spec = {
  prefix: {
    src:
`\t# Comment
# lines
Document`,
    result: [{
      contents: [
        { comment: ' Comment' },
        { comment: ' lines' },
        'Document'
      ]
    }]
  },
  markers: {
    src:
`%YAML 1.2
---
Document
... # Suffix`,
    tgt: [{
      directives: ['YAML 1.2'],
      contents: ['Document']
    }, {
      directives: [{ comment: ' Suffix' }]
    }]
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
    tgt: [{
      contents: ['Bare\ndocument']
    }, {
      directives: [{ comment: ' No document' }]
    }, {
      contents: ['%!PS-Adobe-2.0 # Not the first line']
    }]
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
    tgt: [{
      contents: [
        { items: ['{', 'matches\n%', ':', '20', '}'] }
      ]
    }, {
      contents: [{ comment: ' Empty' }]
    }]
  },
  directives: {
    src:
`%YAML 1.2
--- |
%!PS-Adobe-2.0
...
%YAML 1.2
---
# Empty
...`,
    tgt: [{
      directives: ['YAML 1.2'],
      contents: ['%!PS-Adobe-2.0\n']
    }, {
      directives: ['YAML 1.2'],
      contents: [{ comment: ' Empty' }]
    }]
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
    tgt: [{
      contents: ['Document']
    }, {
      contents: [{ comment: ' Empty' }]
    }, {
      directives: ['YAML 1.2'],
      // FIXME implicit keys is missing
      // contents: [{ items: ['matches %', { indicator: ':', item: '20' }] }]
    }]
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
      const documents = parseStream(src)
      trace: 'DOCUMENTS', documents
      testSpec(documents, tgt)
    })
  }
})
