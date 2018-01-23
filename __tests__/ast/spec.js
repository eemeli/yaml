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

  '7.1. Alias Nodes': {
    'Example 7.1. Alias Nodes': {
      src:
`First occurrence: &anchor Foo
Second occurrence: *anchor
Override anchor: &anchor Bar
Reuse anchor: *anchor`,
      tgt: [ { contents: [ { items: [
        'First occurrence',
        { indicator: ':', item: { anchor: 'anchor', rawValue: 'Foo' } },
        'Second occurrence',
        { indicator: ':', item: 'anchor' },
        'Override anchor',
        { indicator: ':', item: { anchor: 'anchor', rawValue: 'Bar' } },
        'Reuse anchor',
        { indicator: ':', item: 'anchor' }
      ] } ] } ]
    },
  },

  '7.2. Empty Nodes': {
    'Example 7.2. Empty Content': {
      src:
`{
  foo : !!str,
  !!str : bar,
}`,
      tgt: [ { contents: [ { items: [
        '{', 'foo', ':', { tag: '!str' }, ',', { tag: '!str' }, ':', 'bar', ',', '}'
      ] } ] } ]
    },

    'Example 7.3. Completely Empty Flow Nodes': {
      src:
`{
  ? foo :,
  : bar,
}`,
      tgt: [ { contents: [ { items: [ '{', '?', 'foo', ':', ',', ':', 'bar', ',', '}' ] } ] } ]
    },
  },

  '7.3.1. Double-Quoted Style': {
    'Example 7.4. Double Quoted Implicit Keys': {
      src:
`"implicit block key" : [
  "implicit flow key" : value,
 ]`,
      tgt: [ { contents: [ { items: [
        '"implicit block key"',
        { indicator: ':', item: { items: [
          '[', '"implicit flow key"', ':', 'value', ',', ']'
        ] } }
      ] } ] } ]
    },

    'Example 7.5. Double Quoted Line Breaks': {
      src:
`"folded
to a space,\t

to a line feed, or \t\
 \ \tnon-content"`,
      tgt: [ { contents: [ '"folded\nto a space,\t\n\nto a line feed, or \t  \tnon-content"' ] } ]
    },

    'Example 7.6. Double Quoted Lines': {
      src:
`" 1st non-empty

 2nd non-empty
\t3rd non-empty "`,
      tgt: [ { contents: [ '" 1st non-empty\n\n 2nd non-empty\n\t3rd non-empty "' ] } ]
    },
  },

  '7.3.2. Single-Quoted Style': {
    'Example 7.7. Single Quoted Characters': {
      src:
` 'here''s to "quotes"'`,
      tgt: [ { contents: [ '\'here\'\'s to "quotes"\'' ] } ]
    },

    'Example 7.8. Single Quoted Implicit Keys': {
      src:
`'implicit block key' : [
  'implicit flow key' : value,
 ]`,
      tgt: [ { contents: [ { items: [
        '\'implicit block key\'',
        { indicator: ':', item: { items: [
          '[', '\'implicit flow key\'', ':', 'value', ',', ']'
        ] } }
      ] } ] } ]
    },

    'Example 7.9. Single Quoted Lines': {
      src:
`' 1st non-empty

 2nd non-empty
\t3rd non-empty '`,
      tgt: [ { contents: [ '\' 1st non-empty\n\n 2nd non-empty\n\t3rd non-empty \'' ] } ]
    },
  },

  '7.3.3. Plain Style': {
    'Example 7.10. Plain Characters': {
      src:
`# Outside flow collection:
- ::vector
- ": - ()"
- Up, up, and away!
- -123
- http://example.com/foo#bar
# Inside flow collection:
- [ ::vector,
  ": - ()",
  "Up, up and away!",
  -123,
  http://example.com/foo#bar ]`,
      tgt: [ {
        directives: [ { comment: ' Outside flow collection:' } ],
        contents: [ { items: [
          { indicator: '-', item: '::vector' },
          { indicator: '-', item: '": - ()"' },
          { indicator: '-', item: 'Up, up, and away!' },
          { indicator: '-', item: '-123' },
          { indicator: '-', item: 'http://example.com/foo#bar' },
          { comment: ' Inside flow collection:' },
          { indicator: '-', item: { items: [
            '[', '::vector', ',', '": - ()"', ',', '"Up, up and away!"', ',',
            '-123', ',', 'http://example.com/foo#bar', ']'
          ] } }
        ] } ]
      } ]
    },

    'Example 7.11. Plain Implicit Keys': {
      src:
`implicit block key : [
  implicit flow key : value,
 ]`,
      tgt: [ { contents:
        [ { items:
             [ 'implicit block key',
               { indicator: ':',
                 item: { items: [ '[', 'implicit flow key', ':', 'value', ',', ']' ] } } ] } ] } ]
    },

    'Example 7.12. Plain Lines': {
      src:
`1st non-empty

 2nd non-empty
\t3rd non-empty`,
      tgt: [ { contents: [ '1st non-empty\n\n 2nd non-empty\n\t3rd non-empty' ] } ]
    },
  },

  '7.4.1. Flow Sequences': {
    'Example 7.13. Flow Sequence': {
      src:
`- [ one, two, ]
- [three ,four]`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: { items: [ '[', 'one', ',', 'two', ',', ']' ] } },
        { indicator: '-', item: { items: [ '[', 'three', ',', 'four', ']' ] } }
      ] } ] } ]
    },

    'Example 7.14. Flow Sequence Entries': {
      src:
`[
"double
 quoted", 'single
           quoted',
plain
 text, [ nested ],
single: pair,
]`,
      tgt: [ { contents: [ { items: [
        '[', '"double\n quoted"', ',', '\'single\n           quoted\'', ',',
        'plain\n text', ',', { items: [ '[', 'nested', ']' ] }, ',', 'single',
        ':', 'pair', ',', ']'
      ] } ] } ]
    },
  },

  '7.4.2. Flow Mappings': {
    'Example 7.15. Flow Mappings': {
      src:
`- { one : two , three: four , }
- {five: six,seven : eight}`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: { items: [ '{', 'one', ':', 'two', ',', 'three', ':', 'four', ',', '}' ] } },
        { indicator: '-', item: { items: [ '{', 'five', ':', 'six', ',', 'seven', ':', 'eight', '}' ] } }
      ] } ] } ]
    },

    'Example 7.16. Flow Mapping Entries': {
      src:
`{
? explicit: entry,
implicit: entry,
?
}`,
      tgt: [ { contents: [ { items: [
        '{', '?', 'explicit', ':', 'entry', ',', 'implicit', ':', 'entry', ',', '?', '}'
      ] } ] } ]
    },

    'Example 7.17. Flow Mapping Separate Values': {
      src:
`{
unquoted : "separate",
http://foo.com,
omitted value:,
: omitted key,
}`,
      tgt: [ { contents: [ { items: [
        '{', 'unquoted', ':', '"separate"', ',', 'http://foo.com', ',', 'omitted value', ':', ',', ':', 'omitted key', ',', '}'
      ] } ] } ]
    },

    'Example 7.18. Flow Mapping Adjacent Values': {
      src:
`{
"adjacent":value,
"readable": value,
"empty":
}`,
      tgt: [ { contents: [ { items: [
        '{', '"adjacent"', ':', 'value', ',', '"readable"', ':', 'value', ',', '"empty"', ':', '}'
      ] } ] } ]
    },

    'Example 7.19. Single Pair Flow Mappings': {
      src:
`[
foo: bar
]`,
      tgt: [ { contents: [ { items: [ '[', 'foo', ':', 'bar', ']' ] } ] } ]
    },

    'Example 7.20. Single Pair Explicit Entry': {
      src:
`[
? foo
 bar : baz
]`,
      tgt: [ { contents: [ { items: [ '[', '?', 'foo\n bar', ':', 'baz', ']' ] } ] } ]
    },

    'Example 7.21. Single Pair Implicit Entries': {
      src:
`- [ YAML : separate ]
- [ : empty key entry ]
- [ {JSON: like}:adjacent ]`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: { items: [ '[', 'YAML', ':', 'separate', ']' ] } },
        { indicator: '-', item: { items: [ '[', ':', 'empty key entry', ']' ] } },
        { indicator: '-', item: { items: [
          '[', { items: [ '{', 'JSON', ':', 'like', '}' ] }, ':', 'adjacent', ']'
        ] } }
      ] } ] } ]
    },

    'Example 7.22. Invalid Implicit Keys': {
      src:
`[ foo
 bar: invalid,
 "foo...>1K characters...bar": invalid ]`,
      tgt: [ { contents: [ { items: [
        '[', 'foo\n bar', ':', 'invalid', ',', '"foo...>1K characters...bar"', ':', 'invalid', ']'
      ] } ] } ]
      // ERROR: The foo bar key spans multiple lines
      // ERROR: The foo...bar key is too long
    },
  },

  '7.5. Flow Nodes': {
    'Example 7.23. Flow Content': {
      src:
`- [ a, b ]
- { a: b }
- "a"
- 'b'
- c`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: { items: [ '[', 'a', ',', 'b', ']' ] } },
        { indicator: '-', item: { items: [ '{', 'a', ':', 'b', '}' ] } },
        { indicator: '-', item: '"a"' },
        { indicator: '-', item: "'b'" },
        { indicator: '-', item: 'c' }
      ] } ] } ]
    },

    'Example 7.24. Flow Nodes': {
      src:
`- !!str "a"
- 'b'
- &anchor "c"
- *anchor
- !!str`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: { tag: '!str', rawValue: '"a"' } },
        { indicator: '-', item: "'b'" },
        { indicator: '-', item: { anchor: 'anchor', rawValue: '"c"' } },
        { indicator: '-', item: 'anchor' },
        { indicator: '-', item: { tag: '!str' } }
      ] } ] } ]
    },
  },

  '8.1.1. Block Scalar Headers': {
    'Example 8.1. Block Scalar Header': {
      src:
`- | # Empty header
 literal
- >1 # Indentation indicator
  folded
- |+ # Chomping indicator
 keep

- >1- # Both indicators
  strip`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: { comment: ' Empty header', rawValue: ' literal\n' } },
        { indicator: '-', item: { comment: ' Indentation indicator', rawValue: '  folded\n' } },
        { indicator: '-', item: { comment: ' Chomping indicator', rawValue: ' keep\n\n' } },
        { indicator: '-', item: { comment: ' Both indicators', rawValue: '  strip' } }
      ] } ] } ]
    },

    'Example 8.2. Block Indentation Indicator': {
      src:
`- |
 detected
- >


  # detected
- |1
  explicit
- >
 \t
 detected`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: ' detected\n' },
        { indicator: '-', item: '\n\n  # detected\n' },
        { indicator: '-', item: '  explicit\n' },
        { indicator: '-', item: ' \t\n detected' }
      ] } ] } ]
    },

    'Example 8.3. Invalid Block Scalar Indentation Indicators': {
      src:
`- |

 text
- >
  text
 text
- |2
 text`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: '\n text\n' },
        { indicator: '-', item: '  text\n text\n' },
        { indicator: '-', item: ' text' }
      ] } ] } ]
      // ERROR: A leading all-space line must not have too many spaces.
      // ERROR: A following text line must not be less indented.
      // ERROR: The text is less indented than the indicated level.
    },

    'Example 8.4. Chomping Final Line Break': {
      src:
`strip: |-
  text
clip: |
  text
keep: |+
  text\n`,
      tgt: [ { contents: [ { items: [
        'strip',
        { indicator: ':', item: '  text\n' },
        'clip',
        { indicator: ':', item: '  text\n' },
        'keep',
        { indicator: ':', item: '  text\n' }
      ] } ] } ]
    },

    'Example 8.5. Chomping Trailing Lines': {
      src:
`
 # Strip
  # Comments:
strip: |-
  # text

 # Clip
  # comments:

clip: |
  # text

 # Keep
  # comments:

keep: |+
  # text

 # Trail
  # comments.`,
      tgt: [ {
        directives: [ { comment: ' Strip' }, { comment: ' Comments:' } ],
        contents: [ { items: [
          'strip',
          { indicator: ':', item: '  # text\n\n # Clip\n  # comments:\n\n' },
          'clip',
          { indicator: ':', item: '  # text\n\n # Keep\n  # comments:\n\n' },
          'keep',
          { indicator: ':', item: '  # text\n\n # Trail\n  # comments.' }
        ] } ]
      } ]
    },

    'Example 8.6. Empty Scalar Chomping': {
      src:
`strip: >-

clip: >

keep: |+\n\n`,
      tgt: [ { contents: [ { items: [
        'strip',
        { indicator: ':', item: '\n' },
        'clip',
        { indicator: ':', item: '\n' },
        'keep',
        { indicator: ':', item: '\n' }
      ] } ] } ]
    },
  },

  '8.1.2. Literal Style': {
    'Example 8.7. Literal Scalar': {
      src:
`|
 literal
 \ttext\n\n`,
      tgt: [ { contents: [ ' literal\n \ttext\n\n' ] } ]
    },

    'Example 8.8. Literal Content': {
      src:
`|


  literal


  text

 # Comment`,
      tgt: [ { contents: [ '\n\n  literal\n\n\n  text\n\n # Comment' ] } ]
    },
  },

  '8.1.3. Folded Style': {
    'Example 8.9. Folded Scalar': {
      src:
`>
 folded
 text\n\n`,
      tgt: [ { contents: [ ' folded\n text\n\n' ] } ]
    },

    'Example 8.10. Folded Lines': {
      src:
`>

 folded
 line

 next
 line
   * bullet

   * list
   * lines

 last
 line

# Comment`,
      tgt: [ { contents: [
        '\n folded\n line\n\n next\n line\n   * bullet\n\n   * list\n   * lines\n\n last\n line\n\n# Comment'
      ] } ]
    },

    'Example 8.11. More Indented Lines': {
      src:
`>

 folded
 line

 next
 line
   * bullet

   * list
   * lines

 last
 line

# Comment`,
      tgt: [ { contents: [
        '\n folded\n line\n\n next\n line\n   * bullet\n\n   * list\n   * lines\n\n last\n line\n\n# Comment'
      ] } ]
    },

    'Example 8.12. Empty Separation Lines': {
      src:
`>

 folded
 line

 next
 line
   * bullet

   * list
   * line

 last
 line

# Comment`,
      tgt: [ { contents: [
        '\n folded\n line\n\n next\n line\n   * bullet\n\n   * list\n   * line\n\n last\n line\n\n# Comment'
      ] } ]
    },

    'Example 8.13. Final Empty Lines': {
      src:
`>
 folded
 line

 next
 line
   * bullet

   * list
   * line

 last
 line

# Comment`,
      tgt: [ { contents: [
        ' folded\n line\n\n next\n line\n   * bullet\n\n   * list\n   * line\n\n last\n line\n\n# Comment'
      ] } ]
    },
  },

  '8.2.1. Block Sequences': {
    'Example 8.14. Block Sequence': {
      src:
`block sequence:
  - one
  - two : three\n`,
      tgt: [ { contents: [ { items: [
        'block sequence',
        { indicator: ':', item: { items: [
          { indicator: '-', item: 'one' },
          { indicator: '-', item: { items: [
            'two',
            { indicator: ':', item: 'three' }
          ] } }
        ] } }
      ] } ] } ]
    },

    'Example 8.15. Block Sequence Entry Types': {
      src:
`- # Empty
- |
 block node
- - one # Compact
  - two # sequence
- one: two # Compact mapping`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: null, comment: ' Empty' },
        { indicator: '-', item: ' block node\n' },
        { indicator: '-', item: { items: [
          { indicator: '-', item: { comment: ' Compact', rawValue: 'one' } },
          { indicator: '-', item: { comment: ' sequence', rawValue: 'two' } }
        ] } },
        { indicator: '-', item: { items: [
          'one',
          { indicator: ':', item: { comment: ' Compact mapping', rawValue: 'two' } }
        ] } }
      ] } ] } ]
    },
  },

  '8.2.2. Block Mappings': {
    'Example 8.16. Block Mappings': {
      src:
`block mapping:
 key: value\n`,
      tgt: [ { contents: [ { items: [
        'block mapping',
        { indicator: ':', item: { items: [
          'key',
          { indicator: ':', item: 'value' }
        ] } }
      ] } ] } ]
    },

    'Example 8.17. Explicit Block Mapping Entries': {
      src:
`? explicit key # Empty value
? |
  block key
: - one # Explicit compact
  - two # block value\n`,
      tgt: [ { contents: [ { items: [
        { indicator: '?', item: { comment: ' Empty value', rawValue: 'explicit key' } },
        { indicator: '?', item: '  block key\n' },
        { indicator: ':', item: { items: [
          { indicator: '-', item: { comment: ' Explicit compact', rawValue: 'one' } },
          { indicator: '-', item: { comment: ' block value', rawValue: 'two' } }
        ] } }
      ] } ] } ]
    },

    'Example 8.18. Implicit Block Mapping Entries': {
      src:
`plain key: in-line value
: # Both empty
"quoted key":
- entry`,
      tgt: [ { contents: [ { items: [
        'plain key',
        { indicator: ':', item: 'in-line value' },
        { indicator: ':', item: null, comment: ' Both empty' },
        '"quoted key"',
        { indicator: ':', item: { items: [
          { indicator: '-', item: 'entry' }
        ] } }
      ] } ] } ]
    },

    'Example 8.19. Compact Block Mappings': {
      src:
`- sun: yellow
- ? earth: blue
  : moon: white\n`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: { items: [
          'sun',
          { indicator: ':', item: 'yellow' }
        ] } },
        { indicator: '-', item: { items: [
          { indicator: '?', item: { items: [
            'earth',
            { indicator: ':', item: 'blue' }
          ] } },
          { indicator: ':', item: { items: [
            'moon',
            { indicator: ':', item: 'white' }
          ] } }
        ] } }
      ] } ] } ]
    },
  },

  '8.2.3. Block Nodes': {
    'Example 8.20. Block Node Types': {
      src:
`-
  "flow in block"
- >
 Block scalar
- !!map # Block collection
  foo : bar\n`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: '"flow in block"' },
        { indicator: '-', item: ' Block scalar\n' },
        { indicator: '-', item: { tag: '!map', items: [
          { comment: ' Block collection', rawValue: 'foo' },
          { indicator: ':', item: 'bar' }
        ] } }
      ] } ] } ]
    },

    'Example 8.21. Block Scalar Nodes': {
      src:
`literal: |2
  value
folded:
   !foo
  >1
 value`,
      tgt: [ { contents: [ { items: [
        'literal',
        { indicator: ':', item: '  value\n' },
        'folded',
        { indicator: ':', item: { tag: 'foo', rawValue: ' value' } }
      ] } ] } ]
    },

    'Example 8.22. Block Collection Nodes': {
      src:
`sequence: !!seq
- entry
- !!seq
 - nested
mapping: !!map
 foo: bar`,
      tgt: [ { contents: [ { items: [
        'sequence',
        { indicator: ':', item: { tag: '!seq', items: [
          { indicator: '-', item: 'entry' },
          { indicator: '-', item: { tag: '!seq', items: [
            { indicator: '-', item: 'nested' }
          ] } }
        ] } },
        'mapping',
        { indicator: ':', item: { tag: '!map', items: [
          'foo',
          { indicator: ':', item: 'bar' }
        ] } }
      ] } ] } ]
    },
  },

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
  } else if (exp) {
    expect(res).toBeInstanceOf(Object)
    trace: 'test-object', exp
    for (const key in exp) testSpec(res[key], exp[key])
  } else {
    expect(res).toBeNull()
  }
}

for (const section in spec) {
  describe(section, () => {
    for (const name in spec[section]) {
      test(name, () => {
        const { src, tgt } = spec[section][name]
        const documents = parseStream(src)
        trace: 'PARSED', documents.length
        testSpec(documents, tgt)
      })
    }
  })
}
