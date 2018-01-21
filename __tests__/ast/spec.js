import Node from '../../src/ast/Node'
import parseStream from '../../src/ast/parseStream'

const spec = {
  '5.3. Indicator Characters': {
    'Example 5.3. Block Structure Indicators': {
      src:
`sequence:
- one
- two
mapping:
  ? sky
  : blue
  sea : green`,
      tgt: [{ contents: [{ items: [
        'sequence',
        { indicator: ':', item: { items: [
          { indicator: '-', item: 'one' },
          { indicator: '-', item: 'two' }
        ] } },
        'mapping',
        { indicator: ':', item: { items: [
          { indicator: '?', item: 'sky' },
          { indicator: ':', item: 'blue' },
          'sea',
          { indicator: ':', item: 'green' }
        ] } }
      ] }] }]
    },

    'Example 5.4. Flow Collection Indicators': {
      src:
`sequence: [ one, two, ]
mapping: { sky: blue, sea: green }`,
      tgt: [{ contents: [{ items: [
        'sequence',
        { indicator: ':', item: { items: [
          '[', 'one', ',', 'two', ',', ']'
        ] } },
        'mapping',
        { indicator: ':', item: { items: [
          '{', 'sky', ':', 'blue', ',', 'sea', ':', 'green', '}'
        ] } }
      ] }] }]
    },

    'Example 5.5. Comment Indicator': {
      src:
`# Comment only.`,
      tgt: [{ directives: [{ comment: ' Comment only.' }]}]
    },

    'Example 5.6. Node Property Indicators': {
      src:
`anchored: !local &anchor value
alias: *anchor`,
      tgt: [{ contents: [{ items: [
        'anchored',
        { indicator: ':', item: { tag: 'local', anchor: 'anchor', rawValue: 'value' } },
        'alias',
        { indicator: ':', item: { type: Node.Type.ALIAS, rawValue: 'anchor' } }
      ]}]}]
    },

    'Example 5.7. Block Scalar Indicators': {
      src:
`literal: |
  some
  text
folded: >
  some
  text
`,
      tgt: [{ contents: [{ items: [
        'literal',
        { indicator: ':', item: { type: Node.Type.BLOCK_LITERAL, rawValue: '  some\n  text\n' } },
        'folded',
        { indicator: ':', item: { type: Node.Type.BLOCK_FOLDED, rawValue: '  some\n  text\n' } }
      ]}]}]
    },

    'Example 5.8. Quoted Scalar Indicators': {
      src:
`single: 'text'
double: "text"`,
      tgt: [{ contents: [{ items: [
        'single',
        { indicator: ':', item: "'text'" },
        'double',
        { indicator: ':', item: '"text"' }
      ]}]}]
    },

    'Example 5.9. Directive Indicator': {
      src:
`%YAML 1.2
--- text`,
      tgt: [{
        directives: ['YAML 1.2'],
        contents: ['text']
      }]
    },

    'Example 5.10. Invalid use of Reserved Indicators': {
      src:
`commercial-at: @text
grave-accent: \`text`,
      tgt: [{ contents: [{ items: [
        'commercial-at',
        { indicator: ':', item: '@text' },
        'grave-accent',
        { indicator: ':', item: '`text' }
      ]}]}]
      // ERROR: Reserved indicators can't start a plain scalar.
    },

// # 5.4. Line Break Characters

// Example 5.11. Line Break Characters

  },
  '5.5. White Space Characters': {
    'Example 5.12. Tabs and Spaces': {
      src:
`# Tabs and spaces
quoted: "Quoted \t"
block:\t|
  void main() {
  \tprintf("Hello, world!\\n");
  }`,
      tgt: [{
        directives: [{ comment: ' Tabs and spaces' }],
        contents: [{ items: [
          'quoted',
          { indicator: ':', item: '"Quoted \t"' },
          'block',
          { indicator: ':', item: '  void main() {\n  \tprintf("Hello, world!\\n");\n  }' }
        ]}]
      }]
    },

// # 5.6. Miscellaneous Characters

// # 5.7. Escaped Characters

// Example 5.13. Escaped Characters

// "Fun with \\
// \" \a \b \e \f \
// \n \r \t \v \0 \
// \  \_ \N \L \P \
// \x41 \u0041 \U00000041"

// Example 5.14. Invalid Escaped Characters

  },
  '6.1. Indentation Spaces': {
    'Example 6.1. Indentation Spaces': {
      src:
`  # Leading comment line spaces are
   # neither content nor indentation.

Not indented:
 By one space: |
    By four
      spaces
 Flow style: [    # Leading spaces
   By two,        # in flow style
  Also by two,    # are neither
  \tStill by two   # content nor
    ]             # indentation.`,
      tgt: [{
        directives: [
          { comment: ' Leading comment line spaces are' },
          { comment: ' neither content nor indentation.' }
        ],
        contents: [{ items: [
          'Not indented',
          { indicator: ':', item: { items: [
            'By one space',
            { indicator: ':', item: '    By four\n      spaces\n' },
            'Flow style',
            { indicator: ':', item: { items: [
              '[', { comment: ' Leading spaces' },
              'By two', ',', { comment: ' in flow style' },
              'Also by two', ',', { comment: ' are neither' },
              { rawValue: 'Still by two', comment: ' content nor' },
              ']'
            ], comment: ' indentation.' } }
          ] } }
        ]}]
      }]
    },

    'Example 6.2. Indentation Indicators': {
      src:
`? a
: -\tb
  -  -\tc
     - d`,
      tgt: [{ contents: [{ items: [
        { indicator: '?', item: 'a' },
        { indicator: ':', item: { items: [
          { indicator: '-', item: 'b' },
          { indicator: '-', item: { items: [
            { indicator: '-', item: 'c' },
            { indicator: '-', item: 'd' },
          ] } }
        ] } }
      ]}]}]
    },

  },
  '6.2. Separation Spaces': {
    'Example 6.3. Separation Spaces': {
      src:
`- foo:\t bar
- - baz
  -\tbaz`,
      tgt: [{ contents: [{ items: [
        { indicator: '-', item: { items: [
          'foo',
          { indicator: ':', item: 'bar' }
        ] } },
        { indicator: '-', item: { items: [
          { indicator: '-', item: 'baz' },
          { indicator: '-', item: 'baz' },
        ] } }
      ]}]}]
    },

// # 6.3. Line Prefixes

// Example 6.4. Line Prefixes

// # 6.4. Empty Lines

// Example 6.5. Empty Lines

// # 6.5. Line Folding

// Example 6.6. Line Folding

// Example 6.7. Block Folding

// Example 6.8. Flow Folding

  },
  '6.6. Comments': {
    'Example 6.9. Separated Comment': {
      src:
`key:    # Comment
  value`,
      tgt: [{ contents: [{ items: [
        'key',
        { indicator: ':', comment: ' Comment', item: 'value' }
      ]}]}]
    },

    'Example 6.10. Comment Lines': {
      src:
`  # Comment
   \n\n`,
      tgt: [{ directives: [{ comment: ' Comment' }] }]
    },

    'Example 6.11. Multi-Line Comments': {
      src:
`key:    # Comment
        # lines
  value\n`,
      tgt: [{ contents: [{ items: [
        'key',
        { indicator: ':', comment: ' Comment\n        # lines', item: 'value' }
      ] }] }]
    },

  },
  '6.7. Separation Lines': {
    'Example 6.12. Separation Spaces': {
      src:
`{ first: Sammy, last: Sosa }:
# Statistics:
  hr:  # Home runs
     65
  avg: # Average
   0.278`,
      tgt: [{ contents: [{ items: [
        { items: [
          '{', 'first', ':', 'Sammy', ',', 'last', ':', 'Sosa', '}'
        ] },
        { indicator: ':', comment: ' Statistics:', item: { items: [
          'hr',
          { indicator: ':', comment: ' Home runs', item: '65' },
          'avg',
          { indicator: ':', comment: ' Average', item: '0.278' }
        ] } }
      ]}]}]
    },

  },
  '6.8. Directives': {
    'Example 6.13. Reserved Directives': {
      src:
`%FOO  bar baz # Should be ignored
# with a warning.
--- "foo"`,
      tgt: [{
        directives: [
          { rawValue: 'FOO  bar baz', comment: ' Should be ignored' },
          { comment: ' with a warning.' }
        ],
        contents: ['"foo"']
      }]
    },

  },
  '6.8.1. “YAML” Directives': {
    'Example 6.14. “YAML” directive': {
      src:
`%YAML 1.3 # Attempt parsing
           # with a warning
---
"foo"`,
      tgt: [{
        directives: [
          { rawValue: 'YAML 1.3', comment: ' Attempt parsing' },
          { comment: ' with a warning' }
        ],
        contents: ['"foo"']
      }]
    },

    'Example 6.15. Invalid Repeated YAML directive': {
      src:
`%YAML 1.2
%YAML 1.1
foo`,
      tgt: [{
        directives: ['YAML 1.2', 'YAML 1.1'],
        contents: ['foo']
      }]
      // ERROR: The YAML directive must only be given at most once per document.
    },

  },
  '6.8.2. “TAG” Directives': {
    'Example 6.16. “TAG” directive': {
      src:
`%TAG !yaml! tag:yaml.org,2002:
---
!yaml!str "foo"`,
      tgt: [{
        directives: ['TAG !yaml! tag:yaml.org,2002:'],
        contents: [{ tag: 'yaml!str', rawValue: '"foo"' }]
      }]
    },

    'Example 6.17. Invalid Repeated TAG directive': {
      src:
`%TAG ! !foo
%TAG ! !foo
bar`,
      tgt: [{
        directives: ['TAG ! !foo', 'TAG ! !foo'],
        contents: ['bar']
      }]
      // ERROR: The TAG directive must only be given at most once per handle in the same document.
    },

    'Example 6.18. Primary Tag Handle': {
      src:
`# Private
!foo "bar"
...
# Global
%TAG ! tag:example.com,2000:app/
---
!foo "bar"`,
      tgt: [
        {
          directives: [{ comment: ' Private' }],
          contents: [{ tag: 'foo', rawValue: '"bar"' }]
        },
        {
          directives: [{ comment: ' Global' }, 'TAG ! tag:example.com,2000:app/'],
          contents: [{ tag: 'foo', rawValue: '"bar"' }]
        }
      ]
    },

    'Example 6.19. Secondary Tag Handle': {
      src:
`%TAG !! tag:example.com,2000:app/
---
!!int 1 - 3 # Interval, not integer`,
      tgt: [{
        directives: ['TAG !! tag:example.com,2000:app/'],
        contents: [{ tag: '!int', rawValue: '1 - 3', comment: ' Interval, not integer' }]
      }]
    },

    'Example 6.20. Tag Handles': {
      src:
`%TAG !e! tag:example.com,2000:app/
---
!e!foo "bar"`,
      tgt: [{
        directives: ['TAG !e! tag:example.com,2000:app/'],
        contents: [{ tag: 'e!foo', rawValue: '"bar"' }]
      }]
    },

    'Example 6.21. Local Tag Prefix': {
      src:
`%TAG !m! !my-
--- # Bulb here
!m!light fluorescent
...
%TAG !m! !my-
--- # Color here
!m!light green`,
      tgt: [  {
        directives: ['TAG !m! !my-'],
        contents: [
          { comment: ' Bulb here' },
          { tag: 'm!light', rawValue: 'fluorescent' }
        ]
      },
      {
        directives: ['TAG !m! !my-'],
        contents: [
          { comment: ' Color here' },
          { tag: 'm!light', rawValue: 'green' }
        ]
      }]
    },

    'Example 6.22. Global Tag Prefix': {
      src:
`%TAG !e! tag:example.com,2000:app/
---
- !e!foo "bar"`,
      tgt: [{
        directives: ['TAG !e! tag:example.com,2000:app/'],
        contents: [{ items: [
          { indicator: '-', item: { tag: 'e!foo', rawValue: '"bar"' } }
        ] }]
      }]
    },

  },
  '6.9. Node Properties': {
    'Example 6.23. Node Properties': {
      src:
`!!str &a1 "foo":
  !!str bar
&a2 baz : *a1`,
      tgt: [{ contents: [{ items: [
        { tag: '!str', anchor: 'a1', rawValue: '"foo"' },
        { indicator: ':', item: { tag: '!str', rawValue: 'bar' } },
        { anchor: 'a2', rawValue: 'baz' },
        { indicator: ':', item: { type: Node.Type.ALIAS, rawValue: 'a1' } }
      ] }] }]
    },

    'Example 6.24. Verbatim Tags': {
      src:
`!<tag:yaml.org,2002:str> foo :
  !<!bar> baz`,
      tgt: [{ contents: [{ items: [
        { tag: '<tag:yaml.org,2002:str>', rawValue: 'foo' },
        { indicator: ':', item: { tag: '<!bar>', rawValue: 'baz' } }
      ] }] }]
    },

    'Example 6.25. Invalid Verbatim Tags': {
      src:
`- !<!> foo
- !<$:?> bar`,
      tgt: [{ contents: [{ items: [
        { indicator: '-', item: { tag: '<!>', rawValue: 'foo' } },
        { indicator: '-', item: { tag: '<$:?>', rawValue: 'bar' } }
      ] }] }]
      // ERROR: Verbatim tags aren't resolved, so ! is invalid.
      // ERROR: The $:? tag is neither a global URI tag nor a local tag starting with “!”.
    },

    'Example 6.26. Tag Shorthands': {
      src:
`%TAG !e! tag:example.com,2000:app/
---
- !local foo
- !!str bar
- !e!tag%21 baz`,
      tgt: [{
        directives: ['TAG !e! tag:example.com,2000:app/'],
        contents: [{ items: [
          { indicator: '-', item: { tag: 'local', rawValue: 'foo' } },
          { indicator: '-', item: { tag: '!str', rawValue: 'bar' } },
          { indicator: '-', item: { tag: 'e!tag%21', rawValue: 'baz' } }
        ] }]
      }]
    },

    'Example 6.27. Invalid Tag Shorthands': {
      src:
`%TAG !e! tag:example,2000:app/
---
- !e! foo
- !h!bar baz`,
      tgt: [{
        directives: ['TAG !e! tag:example,2000:app/'],
        contents: [{ items: [
          { indicator: '-', item: { tag: 'e!', rawValue: 'foo' } },
          { indicator: '-', item: { tag: 'h!bar', rawValue: 'baz' } }
        ] }]
      }]
      // ERROR: The !o! handle has no suffix.
      // ERROR: The !h! handle wasn't declared.
    },

    'Example 6.28. Non-Specific Tags': {
      src:
`# Assuming conventional resolution:
- "12"
- 12
- ! 12`,
      tgt: [{
        directives: [{ comment: ' Assuming conventional resolution:' }],
        contents: [{ items: [
          { indicator: '-', item: '"12"' },
          { indicator: '-', item: '12' },
          { indicator: '-', item: { tag: '', rawValue: '12' } }
        ] }]
      }]
    },

    'Example 6.29. Node Anchors': {
      src:
`First occurrence: &anchor Value
Second occurrence: *anchor`,
      tgt: [{ contents: [{ items: [
        'First occurrence',
        { indicator: ':', item: { anchor: 'anchor', rawValue: 'Value' } },
        'Second occurrence',
        { indicator: ':', item: { type: Node.Type.ALIAS, rawValue: 'anchor' } }
      ] }] }]
    },
  },

// 7. Flow Styles

// 8. Block Styles

  '9.1. Documents': {

// Example 9.1. Document Prefix

    'Example 9.2. Document Markers': {
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

    'Example 9.3. Bare Documents': {
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

    'Example 9.4. Explicit Documents': {
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

    'Example 9.5. Directives Documents': {
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
  },

  '9.2. Streams': {
    'Example 9.6. Stream': {
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
        contents: [{ items: ['matches %', { indicator: ':', item: '20' }] }]
      }]
    }
  }
}

const testSpec = (res, exp) => {
  if (typeof exp === 'string') {
    const value = res instanceof Node ? res.rawValue : res
    expect(value).toBe(exp)
  } else if (Array.isArray(exp)) {
    expect(res).toBeInstanceOf(Array)
    trace: 'test-array', exp
    exp.forEach((e, i) => testSpec(res[i], e))
  } else {
    expect(res).toBeInstanceOf(Object)
    trace: 'test-object', exp
    for (const key in exp) testSpec(res[key], exp[key])
  }
}

for (const section in spec) {
  describe(section, () => {
    for (const name in spec[section]) {
      test(name, () => {
        const { src, tgt } = spec[section][name]
        const documents = parseStream(src)
        trace: 'PARSED', documents
        testSpec(documents, tgt)
      })
    }
  })
}
