import Node, { Type } from '../../src/ast/Node'
import parse from '../../src/ast/index'
import { pretty, testSpec } from './common'

const spec = {
  '2.1. Collections': {
    'Example 2.1. Sequence of Scalars': {
      src:
`- Mark McGwire\r
- Sammy Sosa\r
- Ken Griffey\r`,
      tgt: [ { contents: [ { type: Type.SEQ, items: [
        { indicator: '-', item: 'Mark McGwire' },
        { indicator: '-', item: 'Sammy Sosa' },
        { indicator: '-', item: 'Ken Griffey' }
      ] } ] } ]
    },

    'Example 2.2. Mapping Scalars to Scalars': {
      src:
`hr:  65    # Home runs\r
avg: 0.278 # Batting average\r
rbi: 147   # Runs Batted In`,
      tgt: [ { contents: [ { type: Type.MAP, items: [
        'hr', { indicator: ':', item: { comment: ' Home runs', strValue: '65' } },
        'avg', { indicator: ':', item: { comment: ' Batting average', strValue: '0.278' } },
        'rbi', { indicator: ':', item: { comment: ' Runs Batted In', strValue: '147' } }
      ] } ] } ]
    },

    'Example 2.3. Mapping Scalars to Sequences': {
      src:
`american:\r
  - Boston Red Sox\r
  - Detroit Tigers\r
  - New York Yankees\r
national:\r
  - New York Mets\r
  - Chicago Cubs\r
  - Atlanta Braves`,
      tgt: [ { contents: [ { items: [
        'american', { indicator: ':', item: { items: [
          { indicator: '-', item: 'Boston Red Sox' },
          { indicator: '-', item: 'Detroit Tigers' },
          { indicator: '-', item: 'New York Yankees' }
        ] } },
        'national', { indicator: ':', item: { items: [
          { indicator: '-', item: 'New York Mets' },
          { indicator: '-', item: 'Chicago Cubs' },
          { indicator: '-', item: 'Atlanta Braves' }
        ] } }
      ] } ] } ]
    },

    'Example 2.4. Sequence of Mappings': {
      src:
`-
  name: Mark McGwire
  hr:   65
  avg:  0.278
-
  name: Sammy Sosa
  hr:   63
  avg:  0.288`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: { items: [
          'name', { indicator: ':', item: 'Mark McGwire' },
          'hr', { indicator: ':', item: '65' },
          'avg', { indicator: ':', item: '0.278' }
        ] } },
        { indicator: '-', item: { items: [
          'name', { indicator: ':', item: 'Sammy Sosa' },
          'hr', { indicator: ':', item: '63' },
          'avg', { indicator: ':', item: '0.288' }
        ] } }
      ] } ] } ]
    },

    'Example 2.5. Sequence of Sequences': {
      src:
`- [name        , hr, avg  ]
- [Mark McGwire, 65, 0.278]
- [Sammy Sosa  , 63, 0.288]`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: { items: [ '[', 'name', ',', 'hr', ',', 'avg', ']' ] } },
        { indicator: '-', item: { items: [ '[', 'Mark McGwire', ',', '65', ',', '0.278', ']' ] } },
        { indicator: '-', item: { items: [ '[', 'Sammy Sosa', ',', '63', ',', '0.288', ']' ] } }
      ] } ] } ]
    },

    'Example 2.6. Mapping of Mappings': {
      src:
`Mark McGwire: {hr: 65, avg: 0.278}
Sammy Sosa: {
    hr: 63,
    avg: 0.288
  }`,
      tgt: [ { contents: [ { items: [
        'Mark McGwire', { indicator: ':', item: { items: [ '{', 'hr', ':', '65', ',', 'avg', ':', '0.278', '}' ] } },
        'Sammy Sosa', { indicator: ':', item: { items: [ '{', 'hr', ':', '63', ',', 'avg', ':', '0.288', '}' ] } }
      ] } ] } ]
    },
  },

  '2.2. Structures': {
    'Example 2.7. Two Documents in a Stream': {
      src:
`# Ranking of 1998 home runs
---
- Mark McGwire
- Sammy Sosa
- Ken Griffey

# Team ranking
---
- Chicago Cubs
- St Louis Cardinals`,
      tgt: [
        {
          directives: [ { comment: ' Ranking of 1998 home runs' } ],
          contents: [ { items: [
            { indicator: '-', item: 'Mark McGwire' },
            { indicator: '-', item: 'Sammy Sosa' },
            { indicator: '-', item: 'Ken Griffey' },
            { comment: ' Team ranking' }
          ] } ]
        }, {
          contents: [ { items: [
            { indicator: '-', item: 'Chicago Cubs' },
            { indicator: '-', item: 'St Louis Cardinals' }
          ] } ]
        }
      ]
    },

    'Example 2.8. Play by Play Feed': {
      src:
`---
time: 20:03:20
player: Sammy Sosa
action: strike (miss)
...
---
time: 20:03:47
player: Sammy Sosa
action: grand slam
...`,
      tgt: [
        { contents: [ { items: [
          'time', { indicator: ':', item: '20:03:20' },
          'player', { indicator: ':', item: 'Sammy Sosa' },
          'action', { indicator: ':', item: 'strike (miss)' }
        ] } ] },
        { contents: [ { items: [
          'time', { indicator: ':', item: '20:03:47' },
          'player', { indicator: ':', item: 'Sammy Sosa' },
          'action', { indicator: ':', item: 'grand slam' }
        ] } ] }
      ]
    },

    'Example 2.9. Single Document with Two Comments': {
      src:
`---
hr: # 1998 hr ranking
  - Mark McGwire
  - Sammy Sosa
rbi:
  # 1998 rbi ranking
  - Sammy Sosa
  - Ken Griffey`,
      tgt: [ { contents: [ { items: [
        'hr', { comment: ' 1998 hr ranking', indicator: ':', item: { items: [
          { indicator: '-', item: 'Mark McGwire' },
          { indicator: '-', item: 'Sammy Sosa' }
        ] } },
        'rbi', { comment: ' 1998 rbi ranking', indicator: ':', item: { items: [
          { indicator: '-', item: 'Sammy Sosa' },
          { indicator: '-', item: 'Ken Griffey' }
        ] } }
      ] } ] } ]
    },

    'Example 2.10. Node for “Sammy Sosa” appears twice in this document': {
      src:
`---
hr:
  - Mark McGwire
  # Following node labeled SS
  - &SS Sammy Sosa
rbi:
  - *SS # Subsequent occurrence
  - Ken Griffey`,
      tgt: [ { contents: [ { items: [
        'hr', { indicator: ':', item: { items: [
          { indicator: '-', item: 'Mark McGwire' },
          { comment: ' Following node labeled SS' },
          { indicator: '-', item: { anchor: 'SS', strValue: 'Sammy Sosa' } }
        ] } },
        'rbi', { indicator: ':', item: { items: [
          { indicator: '-', item: { comment: ' Subsequent occurrence', type: Type.ALIAS, rawValue: '*SS' } },
          { indicator: '-', item: 'Ken Griffey' }
        ] } }
      ] } ] } ]
    },

    'Example 2.11. Mapping between Sequences': {
      src:
`? - Detroit Tigers
  - Chicago cubs
:
  - 2001-07-23

? [ New York Yankees,
    Atlanta Braves ]
: [ 2001-07-02, 2001-08-12,
    2001-08-14 ]`,
      tgt: [ { contents: [ { items: [
        { indicator: '?', item: { items: [
          { indicator: '-', item: 'Detroit Tigers' },
          { indicator: '-', item: 'Chicago cubs' }
        ] } },
        { indicator: ':', item: { items: [
          { indicator: '-', item: '2001-07-23' }
        ] } },
        { indicator: '?', item: { items: [
          '[', 'New York Yankees', ',', 'Atlanta Braves', ']'
        ] } },
        { indicator: ':', item: { items: [
          '[', '2001-07-02', ',', '2001-08-12', ',', '2001-08-14', ']'
        ] } }
      ] } ] } ]
    },

    'Example 2.12. Compact Nested Mapping': {
      src:
`---
# Products purchased
- item    : Super Hoop
  quantity: 1
- item    : Basketball
  quantity: 4
- item    : Big Shoes
  quantity: 1`,
      tgt: [ { contents: [
        { comment: ' Products purchased' },
        { items: [
          { indicator: '-', item: { items: [
            'item', { indicator: ':', item: 'Super Hoop' },
            'quantity', { indicator: ':', item: '1' }
          ] } },
          { indicator: '-', item: { items: [
            'item', { indicator: ':', item: 'Basketball' },
            'quantity', { indicator: ':', item: '4' }
          ] } },
          { indicator: '-', item: { items: [
            'item', { indicator: ':', item: 'Big Shoes' },
            'quantity', { indicator: ':', item: '1' }
          ] } }
        ] }
      ] } ]
    },
  },

  '2.3. Scalars': {
    'Example 2.13. In literals, newlines are preserved': {
      src:
`# ASCII Art
--- |
  \\//||\\/||
  // ||  ||__`,
      tgt: [ {
        directives: [ { comment: ' ASCII Art' } ],
        contents: [ '\\//||\\/||\n// ||  ||__\n' ]
      } ]
    },

    'Example 2.14. In the folded scalars, newlines become spaces': {
      src:
`--- >
  Mark McGwire's
  year was crippled
  by a knee injury.`,
      tgt: [ { contents: [ 'Mark McGwire\'s year was crippled by a knee injury.\n' ] } ]
    },

    'Example 2.15. Folded newlines are preserved for "more indented" and blank lines': {
      src:
`>
 Sammy Sosa completed another
 fine season with great stats.

   63 Home Runs
   0.288 Batting Average

 What a year!`,
      tgt:[ { contents: [
`Sammy Sosa completed another fine season with great stats.

  63 Home Runs
  0.288 Batting Average

What a year!\n`
      ] } ]
    },

    'Example 2.16. Indentation determines scope': {
      src:
`name: Mark McGwire
accomplishment: >
  Mark set a major league
  home run record in 1998.
stats: |
  65 Home Runs
  0.278 Batting Average`,
      tgt: [ { contents: [ { items: [
        'name', { indicator: ':', item: 'Mark McGwire' },
        'accomplishment', { indicator: ':', item: 'Mark set a major league home run record in 1998.\n' },
        'stats', { indicator: ':', item: '65 Home Runs\n0.278 Batting Average\n' }
      ] } ] } ]
    },

    'Example 2.17. Quoted Scalars': {
      src:
`unicode: "Sosa did fine.\\u263A"
control: "\\b1998\\t1999\\t2000\\n"
hex esc: "\\x0d\\x0a is \\r\\n"

single: '"Howdy!" he cried.'
quoted: ' # Not a ''comment''.'
tie-fighter: '|\\-*-/|'`,
      tgt: [ { contents: [ { items: [
        'unicode', { indicator: ':', item: 'Sosa did fine.☺' },
        'control', { indicator: ':', item: '\b1998\t1999\t2000\n' },
        'hex esc', { indicator: ':', item: '\r\n is \r\n' },
        'single', { indicator: ':', item: '"Howdy!" he cried.' },
        'quoted', { indicator: ':', item: ' # Not a \'comment\'.' },
        'tie-fighter', { indicator: ':', item: '|\\-*-/|' }
      ] } ] } ]
    },

    'Example 2.18. Multi-line Flow Scalars': {
      src:
`plain:
  This unquoted scalar
  spans many lines.

quoted: "So does this
  quoted scalar.\n"`,
      tgt: [ { contents: [ { items: [
        'plain', { indicator: ':', item: 'This unquoted scalar spans many lines.' },
        'quoted', { indicator: ':', item: 'So does this quoted scalar. ' }
      ] } ] } ]
    },
  },

  '2.4. Tags': {
    'Example 2.19. Integers': {
      src:
`canonical: 12345
decimal: +12345
octal: 0o14
hexadecimal: 0xC`,
      tgt: [ { contents: [ { items: [
        'canonical', { indicator: ':', item: '12345' },
        'decimal', { indicator: ':', item: '+12345' },
        'octal', { indicator: ':', item: '0o14' },
        'hexadecimal', { indicator: ':', item: '0xC' }
      ] } ] } ]
    },

    'Example 2.20. Floating Point': {
      src:
`canonical: 1.23015e+3
exponential: 12.3015e+02
fixed: 1230.15
negative infinity: -.inf
not a number: .NaN`,
      tgt: [ { contents: [ { items: [
        'canonical', { indicator: ':', item: '1.23015e+3' },
        'exponential', { indicator: ':', item: '12.3015e+02' },
        'fixed', { indicator: ':', item: '1230.15' },
        'negative infinity', { indicator: ':', item: '-.inf' },
        'not a number', { indicator: ':', item: '.NaN' }
      ] } ] } ]
    },

    'Example 2.21. Miscellaneous': {
      src:
`null:
booleans: [ true, false ]
string: '012345'`,
      tgt: [ { contents: [ { items: [
        'null', { indicator: ':', item: null },
        'booleans', { indicator: ':', item: { items: [ '[', 'true', ',', 'false', ']' ] } },
        'string', { indicator: ':', item: '012345' }
      ] } ] } ]
    },

    'Example 2.22. Timestamps': {
      src:
`canonical: 2001-12-15T02:59:43.1Z
iso8601: 2001-12-14t21:59:43.10-05:00
spaced: 2001-12-14 21:59:43.10 -5
date: 2002-12-14`,
      tgt: [ { contents: [ { items: [
        'canonical', { indicator: ':', item: '2001-12-15T02:59:43.1Z' },
        'iso8601', { indicator: ':', item: '2001-12-14t21:59:43.10-05:00' },
        'spaced', { indicator: ':', item: '2001-12-14 21:59:43.10 -5' },
        'date', { indicator: ':', item: '2002-12-14' }
      ] } ] } ]
    },

    'Example 2.23. Various Explicit Tags': {
      src:
`---
not-date: !!str 2002-04-28

picture: !!binary |
 R0lGODlhDAAMAIQAAP//9/X
 17unp5WZmZgAAAOfn515eXv
 Pz7Y6OjuDg4J+fn5OTk6enp
 56enmleECcgggoBADs=

application specific tag: !something |
 The semantics of the tag
 above may be different for
 different documents.`,
      tgt: [ { contents: [ { items: [
        'not-date', { indicator: ':', item: { tag: { handle: '!!', suffix: 'str' }, strValue: '2002-04-28' } },
        'picture', { indicator: ':', item: { tag: { handle: '!!', suffix: 'binary' }, strValue:
          'R0lGODlhDAAMAIQAAP//9/X\n17unp5WZmZgAAAOfn515eXv\nPz7Y6OjuDg4J+fn5OTk6enp\n56enmleECcgggoBADs=\n'
        } },
        'application specific tag', { indicator: ':', item: { tag: { handle: '!', suffix: 'something' }, strValue:
          'The semantics of the tag\nabove may be different for\ndifferent documents.\n'
        } }
      ] } ] } ]
    },

    'Example 2.24. Global Tags': {
      src:
`%TAG ! tag:clarkevans.com,2002:
--- !shape
  # Use the ! handle for presenting
  # tag:clarkevans.com,2002:circle
- !circle
  center: &ORIGIN {x: 73, y: 129}
  radius: 7
- !line
  start: *ORIGIN
  finish: { x: 89, y: 102 }
- !label
  start: *ORIGIN
  color: 0xFFEEBB
  text: Pretty vector drawing.`,
      tgt: [ {
        directives: [{ name: 'TAG', parameters: ['!', 'tag:clarkevans.com,2002:'] }],
        contents: [ {
          tag: { handle: '!', suffix: 'shape' },
          comment: ' Use the ! handle for presenting\n tag:clarkevans.com,2002:circle',
          items: [
            { indicator: '-', item: { tag: { handle: '!', suffix: 'circle' }, items: [
              'center', { indicator: ':', item: { anchor: 'ORIGIN', items: [
                '{', 'x', ':', '73', ',', 'y', ':', '129', '}'
              ] } },
              'radius', { indicator: ':', item: '7' }
            ] } },
            { indicator: '-', item: { tag: { handle: '!', suffix: 'line' }, items: [
              'start', { indicator: ':', item: { type: Type.ALIAS, rawValue: '*ORIGIN' } },
              'finish', { indicator: ':', item: { items: [ '{', 'x', ':', '89', ',', 'y', ':', '102', '}' ] } }
            ] } },
            { indicator: '-', item: { tag: { handle: '!', suffix: 'label' }, items: [
              'start', { indicator: ':', item: { type: Type.ALIAS, rawValue: '*ORIGIN' } },
              'color', { indicator: ':', item: '0xFFEEBB' },
              'text', { indicator: ':', item: 'Pretty vector drawing.' }
            ] } }
          ]
        } ]
      } ]
    },

    'Example 2.25. Unordered Sets': {
      src:
`# Sets are represented as a
# Mapping where each key is
# associated with a null value
--- !!set
? Mark McGwire
? Sammy Sosa
? Ken Griff`,
      tgt: [ {
        directives: [
          { comment: ' Sets are represented as a' },
          { comment: ' Mapping where each key is' },
          { comment: ' associated with a null value' }
        ],
        contents: [ { tag: { handle: '!!', suffix: 'set' }, items: [
          { indicator: '?', item: 'Mark McGwire' },
          { indicator: '?', item: 'Sammy Sosa' },
          { indicator: '?', item: 'Ken Griff' }
        ] } ]
      } ]
    },

    'Example 2.26. Ordered Mappings': {
      src:
`# Ordered maps are represented as
# A sequence of mappings, with
# each mapping having one key
--- !!omap
- Mark McGwire: 65
- Sammy Sosa: 63
- Ken Griffy: 58\n\n`,
      tgt: [ {
        directives: [
          { comment: ' Ordered maps are represented as' },
          { comment: ' A sequence of mappings, with' },
          { comment: ' each mapping having one key' }
        ],
        contents: [ { tag: { handle: '!!', suffix: 'omap' }, items: [
          { indicator: '-', item: { items: [ 'Mark McGwire', { indicator: ':', item: '65' } ] } },
          { indicator: '-', item: { items: [ 'Sammy Sosa', { indicator: ':', item: '63' } ] } },
          { indicator: '-', item: { items: [ 'Ken Griffy', { indicator: ':', item: '58' } ] } }
        ] } ]
      } ]
    },
  },

  '2.5. Full Length Example': {
    'Example 2.27. Invoice': {
      src:
`--- !<tag:clarkevans.com,2002:invoice>
invoice: 34843
date   : 2001-01-23
bill-to: &id001
    given  : Chris
    family : Dumars
    address:
        lines: |
            458 Walkman Dr.
            Suite #292
        city    : Royal Oak
        state   : MI
        postal  : 48046
ship-to: *id001
product:
    - sku         : BL394D
      quantity    : 4
      description : Basketball
      price       : 450.00
    - sku         : BL4438H
      quantity    : 1
      description : Super Hoop
      price       : 2392.00
tax  : 251.42
total: 4443.52
comments:
    Late afternoon is best.
    Backup contact is Nancy
    Billsmer @ 338-4338.`,
      tgt: [ { contents: [ {
        tag: { verbatim: 'tag:clarkevans.com,2002:invoice' },
        items: [
          'invoice', { indicator: ':', item: '34843' },
          'date', { indicator: ':', item: '2001-01-23' },
          'bill-to', { indicator: ':', item: { anchor: 'id001', items: [
            'given', { indicator: ':', item: 'Chris' },
            'family', { indicator: ':', item: 'Dumars' },
            'address', { indicator: ':', item: { items: [
              'lines', { indicator: ':', item: '458 Walkman Dr.\nSuite #292\n' },
              'city', { indicator: ':', item: 'Royal Oak' },
              'state', { indicator: ':', item: 'MI' },
              'postal', { indicator: ':', item: '48046' }
            ] } }
          ] } },
          'ship-to', { indicator: ':', item: { type: Type.ALIAS, rawValue: '*id001' } },
          'product', { indicator: ':', item: { items: [
            { indicator: '-', item: { items: [
              'sku', { indicator: ':', item: 'BL394D' },
              'quantity', { indicator: ':', item: '4' },
              'description', { indicator: ':', item: 'Basketball' },
              'price', { indicator: ':', item: '450.00' }
            ] } },
            { indicator: '-', item: { items: [
              'sku', { indicator: ':', item: 'BL4438H' },
              'quantity', { indicator: ':', item: '1' },
              'description', { indicator: ':', item: 'Super Hoop' },
              'price', { indicator: ':', item: '2392.00' }
            ] } }
          ] } },
          'tax', { indicator: ':', item: '251.42' },
          'total', { indicator: ':', item: '4443.52' },
          'comments', { indicator: ':', item: 'Late afternoon is best. Backup contact is Nancy Billsmer @ 338-4338.' }
        ]
      } ] } ]
    },

    'Example 2.28. Log File': {
      src:
`---
Time: 2001-11-23 15:01:42 -5
User: ed
Warning:
  This is an error message
  for the log file
---
Time: 2001-11-23 15:02:31 -5
User: ed
Warning:
  A slightly different error
  message.
---
Date: 2001-11-23 15:03:17 -5
User: ed
Fatal:
  Unknown variable "bar"
Stack:
  - file: TopClass.py
    line: 23
    code: |
      x = MoreObject("345\\n")
  - file: MoreClass.py
    line: 58
    code: |-
      foo = bar\n`,
      tgt: [
        { contents: [ { items: [
          'Time', { indicator: ':', item: '2001-11-23 15:01:42 -5' },
          'User', { indicator: ':', item: 'ed' },
          'Warning', { indicator: ':', item: 'This is an error message for the log file' }
        ] } ] },
        { contents: [ { items: [
          'Time', { indicator: ':', item: '2001-11-23 15:02:31 -5' },
          'User', { indicator: ':', item: 'ed' },
          'Warning', { indicator: ':', item: 'A slightly different error message.' }
        ] } ] },
        { contents: [ { items: [
          'Date', { indicator: ':', item: '2001-11-23 15:03:17 -5' },
          'User', { indicator: ':', item: 'ed' },
          'Fatal', { indicator: ':', item: 'Unknown variable "bar"' },
          'Stack', { indicator: ':', item: { items: [
            { indicator: '-', item: { items: [
              'file', { indicator: ':', item: 'TopClass.py' },
              'line', { indicator: ':', item: '23' },
              'code', { indicator: ':', item: 'x = MoreObject("345\\n")\n' }
            ] } },
            { indicator: '-', item: { items: [
              'file', { indicator: ':', item: 'MoreClass.py' },
              'line', { indicator: ':', item: '58' },
              'code', { indicator: ':', item: 'foo = bar' }
            ] } }
          ] } }
        ] } ] }
      ]
    },
  },

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
        { indicator: ':', item: { tag: { handle: '!', suffix: 'local' }, anchor: 'anchor', strValue: 'value' } },
        'alias',
        { indicator: ':', item: { type: Type.ALIAS, rawValue: '*anchor' } }
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
        { indicator: ':', item: 'some\ntext\n' },
        'folded',
        { indicator: ':', item: 'some text\n' }
      ]}]}]
    },

    'Example 5.8. Quoted Scalar Indicators': {
      src:
`single: 'text'
double: "text"`,
      tgt: [{ contents: [{ items: [
        'single',
        { indicator: ':', item: 'text' },
        'double',
        { indicator: ':', item: 'text' }
      ]}]}]
    },

    'Example 5.9. Directive Indicator': {
      src:
`%YAML 1.2
--- text`,
      tgt: [{
        directives: [{ name: 'YAML', parameters: ['1.2'] }],
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
          { indicator: ':', item: 'Quoted \t' },
          'block',
          { indicator: ':', item: 'void main() {\n\tprintf("Hello, world!\\n");\n}\n' }
        ]}]
      }]
    },
  },

  '5.7. Escaped Characters': {
    'Example 5.13. Escaped Characters': {
      src:
`"Fun with \\\\
\\" \\a \\b \\e \\f \\
\\n \\r \\t \\v \\0 \\
\\  \\_ \\N \\L \\P \\
\\x41 \\u0041 \\U00000041"`,
      tgt: [ { contents: [
        'Fun with \x5C \x22 \x07 \x08 \x1B \x0C \x0A \x0D \x09 \x0B \x00 \x20 \xA0 \x85 \u2028 \u2029 A A A'
      ] } ]
    },

    'Example 5.14. Invalid Escaped Characters': {
      src:
`Bad escapes:
  "\\c
  \\xq-"`,
      tgt: [ { contents: [ { items: [
        'Bad escapes',
        { indicator: ':', item: { rawValue: '"\\c\n  \\xq-"' }}
      ] } ] } ]
      // ERROR: c is an invalid escaped character.
      // ERROR: q and - are invalid hex digits.
    },
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
            { indicator: ':', item: 'By four\n  spaces\n' },
            'Flow style',
            { indicator: ':', item: { items: [
              '[', { comment: ' Leading spaces' },
              'By two', ',', { comment: ' in flow style' },
              'Also by two', ',', { comment: ' are neither' },
              { strValue: 'Still by two', comment: ' content nor' },
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
  },

  '6.3. Line Prefixes': {
    'Example 6.4. Line Prefixes': {
      src:
`plain: text
  lines
quoted: "text
  \tlines"
block: |
  text
   \tlines`,
      tgt: [{ contents: [{ items: [
        'plain',
        { indicator: ':', item: 'text lines' },
        'quoted',
        { indicator: ':', item: 'text lines' },
        'block',
        { indicator: ':', item: 'text\n \tlines\n' },
      ]}]}]
    },
  },

  '6.4. Empty Lines': {
    'Example 6.5. Empty Lines': {
      src:
`Folding:
  "Empty line
   \t
  as a line feed"
Chomping: |
  Clipped empty lines
 `,
      tgt: [{ contents: [{ items: [
        'Folding',
        { indicator: ':', item: 'Empty line\nas a line feed' },
        'Chomping',
        { indicator: ':', item: 'Clipped empty lines\n' },
      ]}]}]
    },
  },

  '6.5. Line Folding': {
    'Example 6.6. Line Folding': {
      src:
`>-
  trimmed
··
·

··as
··space`.replace(/·/g, ' '),
      tgt: [ { contents: [ 'trimmed\n\n\nas space' ] } ]
    },

    'Example 6.7. Block Folding': {
      src:
`>
··foo·
·
··\t·bar

··baz\n`.replace(/·/g, ' '),
      tgt: [ { contents: [ 'foo \n\n\t bar\n\nbaz\n' ] } ]
    },

    'Example 6.8. Flow Folding': {
      src:
`"
  foo\t
\t
  \t bar

  baz
"`,
      tgt: [ { contents: [' foo\nbar\nbaz '] } ]
    },
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
        { indicator: ':', comment: ' Comment\n lines', item: 'value' }
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
          { name: 'FOO', parameters: ['bar', 'baz'], comment: ' Should be ignored' },
          { comment: ' with a warning.' }
        ],
        contents: ['foo']
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
          { name: 'YAML', parameters: ['1.3'], comment: ' Attempt parsing' },
          { comment: ' with a warning' }
        ],
        contents: ['foo']
      }]
    },

    'Example 6.15. Invalid Repeated YAML directive': {
      src:
`%YAML 1.2
%YAML 1.1
foo`,
      tgt: [{
        directives: [
          { name: 'YAML', parameters: ['1.2'] },
          { name: 'YAML', parameters: ['1.1'] }
        ],
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
        directives: [{ name: 'TAG', parameters: ['!yaml!', 'tag:yaml.org,2002:'] }],
        contents: [{ tag: { handle: '!yaml!', suffix: 'str' }, strValue: 'foo' }]
      }]
    },

    'Example 6.17. Invalid Repeated TAG directive': {
      src:
`%TAG ! !foo
%TAG ! !foo
bar`,
      tgt: [{
        directives: [{ name: 'TAG', parameters: ['!', '!foo'] }, { name: 'TAG', parameters: ['!', '!foo'] }],
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
          contents: [{ tag: { handle: '!', suffix: 'foo' }, strValue: 'bar' }]
        },
        {
          directives: [{ comment: ' Global' }, { name: 'TAG', parameters: ['!', 'tag:example.com,2000:app/'] }],
          contents: [{ tag: { handle: '!', suffix: 'foo' }, strValue: 'bar' }]
        }
      ]
    },

    'Example 6.19. Secondary Tag Handle': {
      src:
`%TAG !! tag:example.com,2000:app/
---
!!int 1 - 3 # Interval, not integer`,
      tgt: [{
        directives: [{ name: 'TAG', parameters: ['!!', 'tag:example.com,2000:app/'] }],
        contents: [{ tag: { handle: '!!', suffix: 'int' }, strValue: '1 - 3', comment: ' Interval, not integer' }]
      }]
    },

    'Example 6.20. Tag Handles': {
      src:
`%TAG !e! tag:example.com,2000:app/
---
!e!foo "bar"`,
      tgt: [{
        directives: [{ name: 'TAG', parameters: ['!e!', 'tag:example.com,2000:app/'] }],
        contents: [{ tag: { handle: '!e!', suffix: 'foo' }, strValue: 'bar' }]
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
        directives: [{ name: 'TAG', parameters: ['!m!', '!my-'] }],
        contents: [
          { comment: ' Bulb here' },
          { tag: { handle: '!m!', suffix: 'light' }, strValue: 'fluorescent' }
        ]
      },
      {
        directives: [{ name: 'TAG', parameters: ['!m!', '!my-'] }],
        contents: [
          { comment: ' Color here' },
          { tag: { handle: '!m!', suffix: 'light' }, strValue: 'green' }
        ]
      }]
    },

    'Example 6.22. Global Tag Prefix': {
      src:
`%TAG !e! tag:example.com,2000:app/
---
- !e!foo "bar"`,
      tgt: [{
        directives: [{ name: 'TAG', parameters: ['!e!', 'tag:example.com,2000:app/'] }],
        contents: [{ items: [
          { indicator: '-', item: { tag: { handle: '!e!', suffix: 'foo' }, strValue: 'bar' } }
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
        { tag: { handle: '!!', suffix: 'str' }, anchor: 'a1', strValue: 'foo' },
        { indicator: ':', item: { tag: { handle: '!!', suffix: 'str' }, strValue: 'bar' } },
        { anchor: 'a2', strValue: 'baz' },
        { indicator: ':', item: { type: Type.ALIAS, rawValue: '*a1' } }
      ] }] }]
    },

    'Example 6.24. Verbatim Tags': {
      src:
`!<tag:yaml.org,2002:str> foo :
  !<!bar> baz`,
      tgt: [{ contents: [{ items: [
        { tag: { verbatim: 'tag:yaml.org,2002:str' }, strValue: 'foo' },
        { indicator: ':', item: { tag: { verbatim: '!bar' }, strValue: 'baz' } }
      ] }] }]
    },

    'Example 6.25. Invalid Verbatim Tags': {
      src:
`- !<!> foo
- !<$:?> bar`,
      tgt: [{ contents: [{ items: [
        { indicator: '-', item: { tag: { verbatim: '!' }, strValue: 'foo' } },
        { indicator: '-', item: { tag: { verbatim: '$:?' }, strValue: 'bar' } }
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
        directives: [{ name: 'TAG', parameters: ['!e!', 'tag:example.com,2000:app/'] }],
        contents: [{ items: [
          { indicator: '-', item: { tag: { handle: '!', suffix: 'local' }, strValue: 'foo' } },
          { indicator: '-', item: { tag: { handle: '!!', suffix: 'str' }, strValue: 'bar' } },
          { indicator: '-', item: { tag: { handle: '!e!', suffix: 'tag%21' }, strValue: 'baz' } }
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
        directives: [{ name: 'TAG', parameters: ['!e!', 'tag:example,2000:app/'] }],
        contents: [{ items: [
          { indicator: '-', item: { tag: { handle: '!e!', suffix: '' }, strValue: 'foo' } },
          { indicator: '-', item: { tag: { handle: '!h!', suffix: 'bar' }, strValue: 'baz' } }
        ] }]
      }]
      // ERROR: The !e! handle has no suffix.
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
          { indicator: '-', item: '12' },
          { indicator: '-', item: '12' },
          { indicator: '-', item: { tag: { handle: '!', suffix: '' }, strValue: '12' } }
        ] }]
      }]
    },

    'Example 6.29. Node Anchors': {
      src:
`First occurrence: &anchor Value
Second occurrence: *anchor`,
      tgt: [{ contents: [{ items: [
        'First occurrence',
        { indicator: ':', item: { anchor: 'anchor', strValue: 'Value' } },
        'Second occurrence',
        { indicator: ':', item: { type: Type.ALIAS, rawValue: '*anchor' } }
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
        { indicator: ':', item: { anchor: 'anchor', strValue: 'Foo' } },
        'Second occurrence',
        { indicator: ':', item: { type: Type.ALIAS, rawValue: '*anchor' } },
        'Override anchor',
        { indicator: ':', item: { anchor: 'anchor', strValue: 'Bar' } },
        'Reuse anchor',
        { indicator: ':', item: { type: Type.ALIAS, rawValue: '*anchor' } }
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
        '{', 'foo', ':', { tag: { handle: '!!', suffix: 'str' } }, ',', { tag: { handle: '!!', suffix: 'str' } }, ':', 'bar', ',', '}'
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
        'implicit block key',
        { indicator: ':', item: { items: [
          '[', 'implicit flow key', ':', 'value', ',', ']'
        ] } }
      ] } ] } ]
    },

    'Example 7.5. Double Quoted Line Breaks': {
      src:
`"folded
to a space,\t

to a line feed, or \t\\
 \\ \tnon-content"`,
      tgt: [ { contents: [ 'folded to a space,\nto a line feed, or \t \tnon-content' ] } ]
    },

    'Example 7.6. Double Quoted Lines': {
      src:
`" 1st non-empty

 2nd non-empty
\t3rd non-empty "`,
      tgt: [ { contents: [ ' 1st non-empty\n2nd non-empty 3rd non-empty ' ] } ]
    },
  },

  '7.3.2. Single-Quoted Style': {
    'Example 7.7. Single Quoted Characters': {
      src:
` 'here''s to "quotes"'`,
      tgt: [ { contents: [ 'here\'s to "quotes"' ] } ]
    },

    'Example 7.8. Single Quoted Implicit Keys': {
      src:
`'implicit block key' : [
  'implicit flow key' : value,
 ]`,
      tgt: [ { contents: [ { items: [
        'implicit block key',
        { indicator: ':', item: { items: [
          '[', 'implicit flow key', ':', 'value', ',', ']'
        ] } }
      ] } ] } ]
    },

    'Example 7.9. Single Quoted Lines': {
      src:
`' 1st non-empty

 2nd non-empty\t
\t3rd non-empty '`,
      tgt: [ { contents: [ ' 1st non-empty\n2nd non-empty 3rd non-empty ' ] } ]
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
          { indicator: '-', item: ': - ()' },
          { indicator: '-', item: 'Up, up, and away!' },
          { indicator: '-', item: '-123' },
          { indicator: '-', item: 'http://example.com/foo#bar' },
          { comment: ' Inside flow collection:' },
          { indicator: '-', item: { items: [
            '[', '::vector', ',', ': - ()', ',', 'Up, up and away!', ',',
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
      tgt: [ { contents: [ '1st non-empty\n2nd non-empty 3rd non-empty' ] } ]
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
        '[', 'double quoted', ',', 'single quoted', ',',
        'plain text', ',', { items: [ '[', 'nested', ']' ] }, ',', 'single',
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
        '{', 'unquoted', ':', 'separate', ',', 'http://foo.com', ',', 'omitted value', ':', ',', ':', 'omitted key', ',', '}'
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
        '{', 'adjacent', ':', 'value', ',', 'readable', ':', 'value', ',', 'empty', ':', '}'
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
      tgt: [ { contents: [ { items: [ '[', '?', 'foo bar', ':', 'baz', ']' ] } ] } ]
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
        '[', 'foo bar', ':', 'invalid', ',', 'foo...>1K characters...bar', ':', 'invalid', ']'
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
        { indicator: '-', item: 'a' },
        { indicator: '-', item: 'b' },
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
        { indicator: '-', item: { tag: { handle: '!!', suffix: 'str' }, strValue: 'a' } },
        { indicator: '-', item: 'b' },
        { indicator: '-', item: { anchor: 'anchor', strValue: 'c' } },
        { indicator: '-', item: { type: Type.ALIAS, rawValue: '*anchor' } },
        { indicator: '-', item: { tag: { handle: '!!', suffix: 'str' } } }
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
        { indicator: '-', item: { comment: ' Empty header', strValue: 'literal\n' } },
        { indicator: '-', item: { comment: ' Indentation indicator', strValue: ' folded\n' } },
        { indicator: '-', item: { comment: ' Chomping indicator', strValue: 'keep\n\n' } },
        { indicator: '-', item: { comment: ' Both indicators', strValue: ' strip' } }
      ] } ] } ]
    },

    'Example 8.2. Block Indentation Indicator': {
      src:
`- |
·detected
- >
·
··
··# detected
- |1
··explicit
- >
·\t
·detected`.replace(/·/g, ' '),
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: 'detected\n' },
        { indicator: '-', item: '\n\n# detected\n' },
        { indicator: '-', item: ' explicit\n' },
        { indicator: '-', item: '\t\ndetected\n' }
      ] } ] } ]
    },

    'Example 8.3. Invalid Block Scalar Indentation Indicators': {
      src:
`- |
··
·text
- >
··text
·text
- |2
·text`.replace(/·/g, ' '),
      tgt: [ { contents: [
        { items: [
          { indicator: '-', item: ' \ntext\n' },
          { indicator: '-', item: 'text\n' },
        ] },
        'text - |2 text'
      ] } ]
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
        { indicator: ':', item: 'text' },
        'clip',
        { indicator: ':', item: 'text\n' },
        'keep',
        { indicator: ':', item: 'text\n' }
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
          { indicator: ':', item: '# text' },
          { comment: ' Clip' },
          { comment: ' comments:' },
          'clip',
          { indicator: ':', item: '# text\n' },
          { comment: ' Keep' },
          { comment: ' comments:' },
          'keep',
          { indicator: ':', item: '# text\n\n' },
          { comment: ' Trail' },
          { comment: ' comments.' }
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
      tgt: [ { contents: [ 'literal\n\ttext\n' ] } ]
    },

    'Example 8.8. Literal Content': {
      src:
`|
·
··
··literal
···
··
··text

·# Comment`.replace(/·/g, ' '),
      tgt: [ { contents: [
        '\n\nliteral\n \n\ntext\n',
        { comment: ' Comment' }
      ] } ]
    },
  },

  '8.1.3. Folded Style': {
    'Example 8.9. Folded Scalar': {
      src:
`>
 folded
 text\n\n`,
      tgt: [ { contents: [ 'folded text\n' ] } ]
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
        '\nfolded line\nnext line\n  * bullet\n\n  * list\n  * lines\n\nlast line\n',
        { comment: ' Comment' }
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
        { indicator: '-', item: 'block node\n' },
        { indicator: '-', item: { items: [
          { indicator: '-', item: { comment: ' Compact', strValue: 'one' } },
          { indicator: '-', item: { comment: ' sequence', strValue: 'two' } }
        ] } },
        { indicator: '-', item: { items: [
          'one',
          { indicator: ':', item: { comment: ' Compact mapping', strValue: 'two' } }
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
        { indicator: '?', item: { comment: ' Empty value', strValue: 'explicit key' } },
        { indicator: '?', item: 'block key\n' },
        { indicator: ':', item: { items: [
          { indicator: '-', item: { comment: ' Explicit compact', strValue: 'one' } },
          { indicator: '-', item: { comment: ' block value', strValue: 'two' } }
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
        'quoted key',
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
    'Example 8.20. Block Types': {
      src:
`-
  "flow in block"
- >
 Block scalar
- !!map # Block collection
  foo : bar\n`,
      tgt: [ { contents: [ { items: [
        { indicator: '-', item: 'flow in block' },
        { indicator: '-', item: 'Block scalar\n' },
        { indicator: '-', item: { tag: { handle: '!!', suffix: 'map' }, comment: ' Block collection', items: [
          'foo',
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
        { indicator: ':', item: 'value\n' },
        'folded',
        { indicator: ':', item: { tag: { handle: '!', suffix: 'foo' }, strValue: 'value\n' } }  // trailing \n against spec
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
        { indicator: ':', item: { tag: { handle: '!!', suffix: 'seq' }, items: [
          { indicator: '-', item: 'entry' },
          { indicator: '-', item: { tag: { handle: '!!', suffix: 'seq' }, items: [
            { indicator: '-', item: 'nested' }
          ] } }
        ] } },
        'mapping',
        { indicator: ':', item: { tag: { handle: '!!', suffix: 'map' }, items: [
          'foo',
          { indicator: ':', item: 'bar' }
        ] } }
      ] } ] } ]
    },
  },

  '9.1. Documents': {

    'Example 9.1. Document Prefix': {
      src:
`\u{FEFF}# Comment
# lines
Document`,
      tgt: [{
        directives: [{ comment: ' Comment' }, { comment: ' lines' }],
        contents: ['Document']
      }]
    },

    'Example 9.2. Document Markers': {
      src:
`%YAML 1.2
---
Document
... # Suffix`,
      tgt: [{
        directives: [{ name: 'YAML', parameters: ['1.2'] }],
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
        contents: ['Bare document']
      }, {
        directives: [{ comment: ' No document' }]
      }, {
        contents: ['%!PS-Adobe-2.0 # Not the first line\n']
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
          { items: ['{', 'matches %', ':', '20', '}'] }
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
        directives: [{ name: 'YAML', parameters: ['1.2'] }],
        contents: ['%!PS-Adobe-2.0\n']
      }, {
        directives: [{ name: 'YAML', parameters: ['1.2'] }],
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
        directives: [{ name: 'YAML', parameters: ['1.2'] }],
        contents: [{ items: ['matches %', { indicator: ':', item: '20' }] }]
      }]
    }
  }
}

for (const section in spec) {
  describe(section, () => {
    for (const name in spec[section]) {
      test(name, () => {
        const { src, tgt } = spec[section][name]
        const documents = parse(src)
        trace: 'PARSED', console.dir(pretty(documents), { depth: null }) || ''
        testSpec(documents, tgt)
        const reSrc = String(documents)
        trace: 'RE-STRUNG', '\n' + reSrc
        // expect(reSrc).toBe(src)
        const reDoc = parse(reSrc)
        trace: 'RE-PARSED', console.dir(pretty(reDoc), { depth: null }) || ''
        testSpec(reDoc, tgt)
      })
    }
  })
}
