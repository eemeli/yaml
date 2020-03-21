import { YAML } from '../../src/index'

const collectionKeyWarning =
  'Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.'

const spec = {
  '2.1. Collections': {
    'Example 2.1. Sequence of Scalars': {
      src: `- Mark McGwire\r
- Sammy Sosa\r
- Ken Griffey\r`,
      tgt: [['Mark McGwire', 'Sammy Sosa', 'Ken Griffey']]
    },

    'Example 2.2. Mapping Scalars to Scalars': {
      src: `hr:  65    # Home runs\r
avg: 0.278 # Batting average\r
rbi: 147   # Runs Batted In`,
      tgt: [
        {
          hr: 65, // ' Home runs'
          avg: 0.278, // ' Batting average'
          rbi: 147 // ' Runs Batted In'
        }
      ]
    },

    'Example 2.3. Mapping Scalars to Sequences': {
      src: `american:\r
  - Boston Red Sox\r
  - Detroit Tigers\r
  - New York Yankees\r
national:\r
  - New York Mets\r
  - Chicago Cubs\r
  - Atlanta Braves`,
      tgt: [
        {
          american: ['Boston Red Sox', 'Detroit Tigers', 'New York Yankees'],
          national: ['New York Mets', 'Chicago Cubs', 'Atlanta Braves']
        }
      ]
    },

    'Example 2.4. Sequence of Mappings': {
      src: `-
  name: Mark McGwire
  hr:   65
  avg:  0.278
-
  name: Sammy Sosa
  hr:   63
  avg:  0.288`,
      tgt: [
        [
          {
            name: 'Mark McGwire',
            hr: 65,
            avg: 0.278
          },
          {
            name: 'Sammy Sosa',
            hr: 63,
            avg: 0.288
          }
        ]
      ]
    },

    'Example 2.5. Sequence of Sequences': {
      src: `- [name        , hr, avg  ]
- [Mark McGwire, 65, 0.278]
- [Sammy Sosa  , 63, 0.288]`,
      tgt: [
        [
          ['name', 'hr', 'avg'],
          ['Mark McGwire', 65, 0.278],
          ['Sammy Sosa', 63, 0.288]
        ]
      ]
    },

    'Example 2.6. Mapping of Mappings': {
      src: `Mark McGwire: {hr: 65, avg: 0.278}
Sammy Sosa: {
    hr: 63,
    avg: 0.288
  }`,
      tgt: [
        {
          'Mark McGwire': { hr: 65, avg: 0.278 },
          'Sammy Sosa': { hr: 63, avg: 0.288 }
        }
      ]
    }
  },

  '2.2. Structures': {
    'Example 2.7. Two Documents in a Stream': {
      src: `# Ranking of 1998 home runs
---
- Mark McGwire
- Sammy Sosa
- Ken Griffey

# Team ranking
---
- Chicago Cubs
- St Louis Cardinals`,
      tgt: [
        // ' Ranking of 1998 home runs'
        ['Mark McGwire', 'Sammy Sosa', 'Ken Griffey'],
        // ' Team ranking'
        ['Chicago Cubs', 'St Louis Cardinals']
      ]
    },

    'Example 2.8. Play by Play Feed': {
      src: `---
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
        {
          time: '20:03:20',
          player: 'Sammy Sosa',
          action: 'strike (miss)'
        },
        {
          time: '20:03:47',
          player: 'Sammy Sosa',
          action: 'grand slam'
        }
      ]
    },

    'Example 2.9. Single Document with Two Comments': {
      src: `---
hr: # 1998 hr ranking
  - Mark McGwire
  - Sammy Sosa
rbi:
  # 1998 rbi ranking
  - Sammy Sosa
  - Ken Griffey`,
      tgt: [
        {
          hr: [
            // ' 1998 hr ranking'
            'Mark McGwire',
            'Sammy Sosa'
          ],
          rbi: [
            // ' 1998 rbi ranking'
            'Sammy Sosa',
            'Ken Griffey'
          ]
        }
      ]
    },

    'Example 2.10. Node for “Sammy Sosa” appears twice in this document': {
      src: `---
hr:
  - Mark McGwire
  # Following node labeled SS
  - &SS Sammy Sosa
rbi:
  - *SS # Subsequent occurrence
  - Ken Griffey`,
      tgt: [
        {
          hr: ['Mark McGwire', /* Following node labeled SS */ 'Sammy Sosa'],
          rbi: ['Sammy Sosa' /* Subsequent occurrence */, 'Ken Griffey']
        }
      ]
    },

    'Example 2.11. Mapping between Sequences': {
      src: `? - Detroit Tigers
  - Chicago cubs
:
  - 2001-07-23

? [ New York Yankees,
    Atlanta Braves ]
: [ 2001-07-02, 2001-08-12,
    2001-08-14 ]`,
      tgt: [
        {
          '[ Detroit Tigers, Chicago cubs ]': ['2001-07-23'],
          '[ New York Yankees, Atlanta Braves ]': [
            '2001-07-02',
            '2001-08-12',
            '2001-08-14'
          ]
        }
      ],
      warnings: [[collectionKeyWarning]]
    },

    'Example 2.12. Compact Nested Mapping': {
      src: `---
# Products purchased
- item    : Super Hoop
  quantity: 1
- item    : Basketball
  quantity: 4
- item    : Big Shoes
  quantity: 1`,
      tgt: [
        [
          // Products purchased
          { item: 'Super Hoop', quantity: 1 },
          { item: 'Basketball', quantity: 4 },
          { item: 'Big Shoes', quantity: 1 }
        ]
      ]
    }
  },

  '2.3. Scalars': {
    'Example 2.13. In literals, newlines are preserved': {
      src: `# ASCII Art
--- |
  \\//||\\/||
  // ||  ||__`,
      tgt: ['\\//||\\/||\n' + '// ||  ||__\n']
    },

    'Example 2.14. In the folded scalars, newlines become spaces': {
      src: `--- >
  Mark McGwire's
  year was crippled
  by a knee injury.`,
      tgt: ["Mark McGwire's year was crippled by a knee injury.\n"]
    },

    'Example 2.15. Folded newlines are preserved for "more indented" and blank lines': {
      src: `>
 Sammy Sosa completed another
 fine season with great stats.

   63 Home Runs
   0.288 Batting Average

 What a year!`,
      tgt: [
        `Sammy Sosa completed another fine season with great stats.

  63 Home Runs
  0.288 Batting Average

What a year!\n`
      ]
    },

    'Example 2.16. Indentation determines scope': {
      src: `name: Mark McGwire
accomplishment: >
  Mark set a major league
  home run record in 1998.
stats: |
  65 Home Runs
  0.278 Batting Average`,
      tgt: [
        {
          name: 'Mark McGwire',
          accomplishment: 'Mark set a major league home run record in 1998.\n',
          stats: '65 Home Runs\n0.278 Batting Average\n'
        }
      ]
    },

    'Example 2.17. Quoted Scalars': {
      src: `unicode: "Sosa did fine.\\u263A"
control: "\\b1998\\t1999\\t2000\\n"
hex esc: "\\x0d\\x0a is \\r\\n"

single: '"Howdy!" he cried.'
quoted: ' # Not a ''comment''.'
tie-fighter: '|\\-*-/|'`,
      tgt: [
        {
          unicode: 'Sosa did fine.☺',
          control: '\b1998\t1999\t2000\n',
          'hex esc': '\r\n is \r\n',
          single: '"Howdy!" he cried.',
          quoted: " # Not a 'comment'.",
          'tie-fighter': '|\\-*-/|'
        }
      ]
    },

    'Example 2.18. Multi-line Flow Scalars': {
      src: `plain:
  This unquoted scalar
  spans many lines.

quoted: "So does this
  quoted scalar.\\n"`,
      tgt: [
        {
          plain: 'This unquoted scalar spans many lines.',
          quoted: 'So does this quoted scalar.\n'
        }
      ]
    }
  },

  '2.4. Tags': {
    'Example 2.19. Integers': {
      src: `canonical: 12345
decimal: +12345
octal: 0o14
hexadecimal: 0xC`,
      tgt: [
        {
          canonical: 12345,
          decimal: 12345,
          octal: 12,
          hexadecimal: 12
        }
      ]
    },

    'Example 2.20. Floating Point': {
      src: `canonical: 1.23015e+3
exponential: 12.3015e+02
fixed: 1230.15
negative infinity: -.inf
not a number: .NaN`,
      tgt: [
        {
          canonical: 1230.15,
          exponential: 1230.15,
          fixed: 1230.15,
          'negative infinity': -Infinity,
          'not a number': NaN
        }
      ]
    },

    'Example 2.21. Miscellaneous': {
      src: `null:
booleans: [ true, false ]
string: '012345'`,
      tgt: [
        {
          '': null,
          booleans: [true, false],
          string: '012345'
        }
      ]
    },

    'Example 2.22. Timestamps': {
      src: `canonical: 2001-12-15T02:59:43.1Z
iso8601: 2001-12-14t21:59:43.10-05:00
spaced: 2001-12-14 21:59:43.10 -5
date: 2001-12-14`,
      tgt: [
        {
          canonical: '2001-12-15T02:59:43.1Z',
          iso8601: '2001-12-14t21:59:43.10-05:00',
          spaced: '2001-12-14 21:59:43.10 -5',
          date: '2001-12-14'
        }
      ],
      special: src => {
        const obj = YAML.parse(src, { schema: 'yaml-1.1' })
        expect(Object.keys(obj)).toHaveLength(4)
        ;[('canonical', 'iso8601', 'spaced', 'date')].forEach(key => {
          const date = obj[key]
          expect(date).toBeInstanceOf(Date)
          expect(date.getFullYear()).toBe(2001)
          expect(date.getMonth()).toBe(11)
        })
      }
    },

    'Example 2.23. Various Explicit Tags': {
      src: `---
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
      tgt: [
        {
          'not-date': '2002-04-28',
          picture:
            'R0lGODlhDAAMAIQAAP//9/X\n17unp5WZmZgAAAOfn515eXv\nPz7Y6OjuDg4J+fn5OTk6enp\n56enmleECcgggoBADs=\n',
          'application specific tag':
            'The semantics of the tag\nabove may be different for\ndifferent documents.\n'
        }
      ],
      warnings: [
        [
          'The tag tag:yaml.org,2002:binary is unavailable, falling back to tag:yaml.org,2002:str',
          'The tag !something is unavailable, falling back to tag:yaml.org,2002:str'
        ]
      ],
      special: src => {
        const doc = YAML.parseDocument(src, { schema: 'yaml-1.1' })
        const data = doc.contents.items[1].value.value
        expect(data).toBeInstanceOf(Uint8Array)
        expect(data.byteLength).toBe(65)
      }
    },

    'Example 2.24. Global Tags': {
      src: `%TAG ! tag:clarkevans.com,2002:
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
      tgt: [
        [
          { center: { x: 73, y: 129 }, radius: 7 },
          { start: { x: 73, y: 129 }, finish: { x: 89, y: 102 } },
          {
            start: { x: 73, y: 129 },
            color: 16772795,
            text: 'Pretty vector drawing.'
          }
        ]
      ],
      warnings: [
        [
          'The tag tag:clarkevans.com,2002:shape is unavailable, falling back to tag:yaml.org,2002:seq',
          'The tag tag:clarkevans.com,2002:circle is unavailable, falling back to tag:yaml.org,2002:map',
          'The tag tag:clarkevans.com,2002:line is unavailable, falling back to tag:yaml.org,2002:map',
          'The tag tag:clarkevans.com,2002:label is unavailable, falling back to tag:yaml.org,2002:map'
        ]
      ]
    },

    'Example 2.25. Unordered Sets': {
      src: `# Sets are represented as a
# Mapping where each key is
# associated with a null value
--- !!set
? Mark McGwire
? Sammy Sosa
? Ken Griff`,
      tgt: [
        {
          'Mark McGwire': null,
          'Sammy Sosa': null,
          'Ken Griff': null
        }
      ],
      warnings: [
        [
          'The tag tag:yaml.org,2002:set is unavailable, falling back to tag:yaml.org,2002:map'
        ]
      ]
    },

    'Example 2.26. Ordered Mappings': {
      src: `# Ordered maps are represented as
# A sequence of mappings, with
# each mapping having one key
--- !!omap
- Mark McGwire: 65
- Sammy Sosa: 63
- Ken Griffy: 58\n\n`,
      tgt: [
        [{ 'Mark McGwire': 65 }, { 'Sammy Sosa': 63 }, { 'Ken Griffy': 58 }]
      ],
      warnings: [
        [
          'The tag tag:yaml.org,2002:omap is unavailable, falling back to tag:yaml.org,2002:seq'
        ]
      ]
    }
  },

  '2.5. Full Length Example': {
    'Example 2.27. Invoice': {
      src: `--- !<tag:clarkevans.com,2002:invoice>
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
      tgt: [
        {
          invoice: 34843,
          date: '2001-01-23',
          'bill-to': {
            given: 'Chris',
            family: 'Dumars',
            address: {
              lines: '458 Walkman Dr.\nSuite #292\n',
              city: 'Royal Oak',
              state: 'MI',
              postal: 48046
            }
          },
          'ship-to': {
            given: 'Chris',
            family: 'Dumars',
            address: {
              lines: '458 Walkman Dr.\nSuite #292\n',
              city: 'Royal Oak',
              state: 'MI',
              postal: 48046
            }
          },
          product: [
            {
              sku: 'BL394D',
              quantity: 4,
              description: 'Basketball',
              price: 450
            },
            {
              sku: 'BL4438H',
              quantity: 1,
              description: 'Super Hoop',
              price: 2392
            }
          ],
          tax: 251.42,
          total: 4443.52,
          comments:
            'Late afternoon is best. Backup contact is Nancy Billsmer @ 338-4338.'
        }
      ],
      warnings: [
        [
          'The tag tag:clarkevans.com,2002:invoice is unavailable, falling back to tag:yaml.org,2002:map'
        ]
      ]
    },

    'Example 2.28. Log File': {
      src: `---
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
        {
          Time: '2001-11-23 15:01:42 -5',
          User: 'ed',
          Warning: 'This is an error message for the log file'
        },
        {
          Time: '2001-11-23 15:02:31 -5',
          User: 'ed',
          Warning: 'A slightly different error message.'
        },
        {
          Date: '2001-11-23 15:03:17 -5',
          User: 'ed',
          Fatal: 'Unknown variable "bar"',
          Stack: [
            {
              file: 'TopClass.py',
              line: 23,
              code: 'x = MoreObject("345\\n")\n'
            },
            { file: 'MoreClass.py', line: 58, code: 'foo = bar' }
          ]
        }
      ]
    }
  },

  '5.3. Indicator Characters': {
    'Example 5.3. Block Structure Indicators': {
      src: `sequence:
- one
- two
mapping:
  ? sky
  : blue
  sea : green`,
      tgt: [
        {
          sequence: ['one', 'two'],
          mapping: { sky: 'blue', sea: 'green' }
        }
      ]
    },

    'Example 5.4. Flow Collection Indicators': {
      src: `sequence: [ one, two, ]
mapping: { sky: blue, sea: green }`,
      tgt: [
        {
          sequence: ['one', 'two'],
          mapping: { sky: 'blue', sea: 'green' }
        }
      ]
    },

    'Example 5.5. Comment Indicator': {
      src: `# Comment only.`,
      tgt: [null]
    },

    'Example 5.6. Node Property Indicators': {
      src: `anchored: !local &anchor value
alias: *anchor`,
      tgt: [{ anchored: 'value', alias: 'value' }],
      warnings: [
        ['The tag !local is unavailable, falling back to tag:yaml.org,2002:str']
      ],
      special: src => {
        const tag = {
          tag: '!local',
          resolve: (doc, node) => 'local:' + node.strValue
        }
        const res = YAML.parse(src, { customTags: [tag] })
        expect(res).toMatchObject({
          anchored: 'local:value',
          alias: 'local:value'
        })
      }
    },

    'Example 5.7. Block Scalar Indicators': {
      src: `literal: |
  some
  text
folded: >
  some
  text
`,
      tgt: [
        {
          literal: 'some\ntext\n',
          folded: 'some text\n'
        }
      ]
    },

    'Example 5.8. Quoted Scalar Indicators': {
      src: `single: 'text'
double: "text"`,
      tgt: [{ single: 'text', double: 'text' }]
    },

    'Example 5.9. Directive Indicator': {
      src: `%YAML 1.2
--- text`,
      tgt: ['text'],
      special: src => {
        const doc = YAML.parseDocument(src)
        expect(doc.version).toBe('1.2')
      }
    },

    'Example 5.10. Invalid use of Reserved Indicators': {
      src: `commercial-at: @text
grave-accent: \`text`,
      tgt: [{ 'commercial-at': '@text', 'grave-accent': '`text' }],
      errors: [
        [
          // ERROR: Reserved indicators can't start a plain scalar.
        ]
      ]
    }
  },
  '5.5. White Space Characters': {
    'Example 5.12. Tabs and Spaces': {
      src: `# Tabs and spaces
quoted: "Quoted \t"
block:\t|
  void main() {
  \tprintf("Hello, world!\\n");
  }`,
      tgt: [
        {
          quoted: 'Quoted \t',
          block: 'void main() {\n\tprintf("Hello, world!\\n");\n}\n'
        }
      ]
    }
  },

  '5.7. Escaped Characters': {
    'Example 5.13. Escaped Characters': {
      src: `"Fun with \\\\
\\" \\a \\b \\e \\f \\
\\n \\r \\t \\v \\0 \\
\\  \\_ \\N \\L \\P \\
\\x41 \\u0041 \\U00000041"`,
      tgt: [
        'Fun with \x5C \x22 \x07 \x08 \x1B \x0C \x0A \x0D \x09 \x0B \x00 \x20 \xA0 \x85 \u2028 \u2029 A A A'
      ]
    },

    'Example 5.14. Invalid Escaped Characters': {
      src: `Bad escapes:
  "\\c
  \\xq-"`,
      tgt: [{ 'Bad escapes': '\\c \\xq-' }],
      errors: [
        [
          'Invalid escape sequence \\c'
          // ERROR: q and - are invalid hex digits.
        ]
      ]
    }
  },

  '6.1. Indentation Spaces': {
    'Example 6.1. Indentation Spaces': {
      src: `  # Leading comment line spaces are
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
      tgt: [
        {
          'Not indented': {
            'By one space': 'By four\n  spaces\n',
            'Flow style': ['By two', 'Also by two', 'Still by two']
          }
        }
      ]
    },

    'Example 6.2. Indentation Indicators': {
      src: `? a
: -\tb
  -  -\tc
     - d`,
      tgt: [{ a: ['b', ['c', 'd']] }]
    }
  },

  '6.2. Separation Spaces': {
    'Example 6.3. Separation Spaces': {
      src: `- foo:\t bar
- - baz
  -\tbaz`,
      tgt: [[{ foo: 'bar' }, ['baz', 'baz']]]
    }
  },

  '6.3. Line Prefixes': {
    'Example 6.4. Line Prefixes': {
      src: `plain: text
  lines
quoted: "text
  \tlines"
block: |
  text
   \tlines`,
      tgt: [
        {
          plain: 'text lines',
          quoted: 'text lines',
          block: 'text\n \tlines\n'
        }
      ]
    }
  },

  '6.4. Empty Lines': {
    'Example 6.5. Empty Lines': {
      src: `Folding:
  "Empty line
   \t
  as a line feed"
Chomping: |
  Clipped empty lines
 `,
      tgt: [
        {
          Folding: 'Empty line\nas a line feed',
          Chomping: 'Clipped empty lines\n'
        }
      ]
    }
  },

  '6.5. Line Folding': {
    'Example 6.6. Line Folding': {
      src: `>-
  trimmed
··
·

··as
··space`.replace(/·/g, ' '),
      tgt: ['trimmed\n\n\nas space']
    },

    'Example 6.7. Block Folding': {
      src: `>
··foo·
·
··\t·bar

··baz\n`.replace(/·/g, ' '),
      tgt: ['foo \n\n\t bar\n\nbaz\n']
    },

    'Example 6.8. Flow Folding': {
      src: `"
  foo\t
\t
  \t bar

  baz
"`,
      tgt: [' foo\nbar\nbaz ']
    }
  },

  '6.6. Comments': {
    'Example 6.9. Separated Comment': {
      src: `key:    # Comment
  value`,
      tgt: [{ key: 'value' }]
    },

    'Example 6.10. Comment Lines': {
      src: `  # Comment
   \n\n`,
      tgt: [null]
    },

    'Example 6.11. Multi-Line Comments': {
      src: `key:    # Comment
        # lines
  value\n`,
      tgt: [{ key: 'value' }]
    }
  },
  '6.7. Separation Lines': {
    'Example 6.12. Separation Spaces': {
      src: `{ first: Sammy, last: Sosa }:
# Statistics:
  hr:  # Home runs
     65
  avg: # Average
   0.278`,
      tgt: [{ '{ first: Sammy, last: Sosa }': { hr: 65, avg: 0.278 } }],
      warnings: [[collectionKeyWarning]]
    }
  },
  '6.8. Directives': {
    'Example 6.13. Reserved Directives': {
      src: `%FOO  bar baz # Should be ignored
# with a warning.
--- "foo"`,
      tgt: ['foo'],
      warnings: [['YAML only supports %TAG and %YAML directives, and not %FOO']]
    }
  },
  '6.8.1. “YAML” Directives': {
    'Example 6.14. “YAML” directive': {
      src: `%YAML 1.3 # Attempt parsing
           # with a warning
---
"foo"`,
      tgt: ['foo'],
      warnings: [['Document will be parsed as YAML 1.2 rather than YAML 1.3']],
      special: src => {
        const doc = YAML.parseDocument(src)
        expect(doc.version).toBe('1.3')
      }
    },

    'Example 6.15. Invalid Repeated YAML directive': {
      src: `%YAML 1.2
%YAML 1.1
---
foo`,
      tgt: ['foo'],
      errors: [
        ['The %YAML directive must only be given at most once per document.']
      ],
      special: src => {
        const doc = YAML.parseDocument(src)
        expect(doc.version).toBe('1.1')
      }
    }
  },
  '6.8.2. “TAG” Directives': {
    'Example 6.16. “TAG” directive': {
      src: `%TAG !yaml! tag:yaml.org,2002:
---
!yaml!str "foo"`,
      tgt: ['foo']
    },

    'Example 6.17. Invalid Repeated TAG directive': {
      src: `%TAG ! !foo
%TAG ! !foo
---
bar`,
      tgt: ['bar'],
      errors: [
        [
          'The %TAG directive must only be given at most once per handle in the same document.'
        ]
      ],
      special: src => {
        const doc = YAML.parseDocument(src)
        expect(doc.tagPrefixes).toMatchObject([{ handle: '!', prefix: '!foo' }])
      }
    },

    'Example 6.18. Primary Tag Handle': {
      src: `# Private
!foo "bar"
...
# Global
%TAG ! tag:example.com,2000:app/
---
!foo "bar"`,
      tgt: ['bar', 'bar'],
      warnings: [
        ['The tag !foo is unavailable, falling back to tag:yaml.org,2002:str'],
        [
          'The tag tag:example.com,2000:app/foo is unavailable, falling back to tag:yaml.org,2002:str'
        ]
      ],
      special: src => {
        const customTags = [
          {
            tag: '!foo',
            resolve: () => 'private'
          },
          {
            tag: 'tag:example.com,2000:app/foo',
            resolve: () => 'global'
          }
        ]
        const docs = YAML.parseAllDocuments(src, { customTags })
        expect(docs.map(d => d.toJSON())).toMatchObject(['private', 'global'])
      }
    },

    'Example 6.19. Secondary Tag Handle': {
      src: `%TAG !! tag:example.com,2000:app/
---
!!int 1 - 3 # Interval, not integer`,
      tgt: ['1 - 3'],
      warnings: [
        [
          'The tag tag:example.com,2000:app/int is unavailable, falling back to tag:yaml.org,2002:str'
        ]
      ],
      special: src => {
        const tag = {
          tag: 'tag:example.com,2000:app/int',
          resolve: () => 'interval'
        }
        const res = YAML.parse(src, { customTags: [tag] })
        expect(res).toBe('interval')
      }
    },

    'Example 6.20. Tag Handles': {
      src: `%TAG !e! tag:example.com,2000:app/
---
!e!foo "bar"`,
      tgt: ['bar'],
      warnings: [
        [
          'The tag tag:example.com,2000:app/foo is unavailable, falling back to tag:yaml.org,2002:str'
        ]
      ],
      special: src => {
        const tag = {
          tag: 'tag:example.com,2000:app/foo',
          resolve: (doc, node) => 'foo' + node.strValue
        }
        const res = YAML.parse(src, { customTags: [tag] })
        expect(res).toBe('foobar')
      }
    },

    'Example 6.21. Local Tag Prefix': {
      src: `%TAG !m! !my-
--- # Bulb here
!m!light fluorescent
...
%TAG !m! !my-
--- # Color here
!m!light green`,
      tgt: ['fluorescent', 'green'],
      warnings: [
        [
          'The tag !my-light is unavailable, falling back to tag:yaml.org,2002:str'
        ],
        [
          'The tag !my-light is unavailable, falling back to tag:yaml.org,2002:str'
        ]
      ],
      special: src => {
        const tag = {
          tag: '!my-light',
          resolve: (doc, node) => 'light:' + node.strValue
        }
        const docs = YAML.parseAllDocuments(src, { customTags: [tag] })
        expect(docs.map(d => d.toJSON())).toMatchObject([
          'light:fluorescent',
          'light:green'
        ])
      }
    },

    'Example 6.22. Global Tag Prefix': {
      src: `%TAG !e! tag:example.com,2000:app/
---
- !e!foo "bar"`,
      tgt: [['bar']],
      warnings: [
        [
          'The tag tag:example.com,2000:app/foo is unavailable, falling back to tag:yaml.org,2002:str'
        ]
      ],
      special: src => {
        const tag = {
          tag: 'tag:example.com,2000:app/foo',
          resolve: (doc, node) => 'foo' + node.strValue
        }
        const res = YAML.parse(src, { customTags: [tag] })
        expect(res).toMatchObject(['foobar'])
      }
    }
  },
  '6.9. Node Properties': {
    'Example 6.23. Node Properties': {
      src: `!!str &a1 "foo":
  !!str bar
&a2 baz : *a1`,
      tgt: [{ foo: 'bar', baz: 'foo' }]
    },

    'Example 6.24. Verbatim Tags': {
      src: `!<tag:yaml.org,2002:str> foo :
  !<!bar> baz`,
      tgt: [{ foo: 'baz' }],
      warnings: [
        ['The tag !bar is unavailable, falling back to tag:yaml.org,2002:str']
      ],
      special: src => {
        const tag = {
          tag: '!bar',
          resolve: (doc, node) => 'bar' + node.strValue
        }
        const res = YAML.parse(src, { customTags: [tag] })
        expect(res).toMatchObject({ foo: 'barbaz' })
      }
    },

    'Example 6.25. Invalid Verbatim Tags': {
      src: `- !<!> foo
- !<$:?> bar`,
      tgt: [['foo', 'bar']],
      errors: [["Verbatim tags aren't resolved, so ! is invalid."]],
      warnings: [
        ['The tag $:? is unavailable, falling back to tag:yaml.org,2002:str']
      ]
    },

    'Example 6.26. Tag Shorthands': {
      src: `%TAG !e! tag:example.com,2000:app/
---
- !local foo
- !!str bar
- !e!tag%21 baz`,
      tgt: [['foo', 'bar', 'baz']],
      warnings: [
        [
          'The tag !local is unavailable, falling back to tag:yaml.org,2002:str',
          'The tag tag:example.com,2000:app/tag! is unavailable, falling back to tag:yaml.org,2002:str'
        ]
      ],
      special: src => {
        const customTags = [
          {
            tag: '!local',
            resolve: (doc, node) => 'local:' + node.strValue
          },
          {
            tag: 'tag:example.com,2000:app/tag!',
            resolve: (doc, node) => 'tag!' + node.strValue
          }
        ]
        const res = YAML.parse(src, { customTags })
        expect(res).toMatchObject(['local:foo', 'bar', 'tag!baz'])
      }
    },

    'Example 6.27. Invalid Tag Shorthands': {
      src: `%TAG !e! tag:example,2000:app/
---
- !e! foo
- !h!bar baz`,
      tgt: [['foo', 'baz']],
      errors: [
        [
          'The !e! tag has no suffix.',
          'The !h! tag handle is non-default and was not declared.'
        ]
      ]
    },

    'Example 6.28. Non-Specific Tags': {
      src: `# Assuming conventional resolution:
- "12"
- 12
- ! 12`,
      tgt: [['12', 12, '12']]
    },

    'Example 6.29. Node Anchors': {
      src: `First occurrence: &anchor Value
Second occurrence: *anchor`,
      tgt: [
        {
          'First occurrence': 'Value',
          'Second occurrence': 'Value'
        }
      ]
    }
  },

  '7.1. Alias Nodes': {
    'Example 7.1. Alias Nodes': {
      src: `First occurrence: &anchor Foo
Second occurrence: *anchor
Override anchor: &anchor Bar
Reuse anchor: *anchor`,
      tgt: [
        {
          'First occurrence': 'Foo',
          'Second occurrence': 'Foo',
          'Override anchor': 'Bar',
          'Reuse anchor': 'Bar'
        }
      ]
    }
  },

  '7.2. Empty Nodes': {
    'Example 7.2. Empty Content': {
      src: `{
  foo : !!str,
  !!str : bar,
}`,
      tgt: [{ foo: '', '': 'bar' }]
    },

    'Example 7.3. Completely Empty Flow Nodes': {
      src: `{
  ? foo :,
  : bar,
}`,
      tgt: [{ foo: null, '': 'bar' }]
    }
  },

  '7.3.1. Double-Quoted Style': {
    'Example 7.4. Double Quoted Implicit Keys': {
      src: `"implicit block key" : [
  "implicit flow key" : value,
 ]`,
      tgt: [{ 'implicit block key': [{ 'implicit flow key': 'value' }] }]
    },

    'Example 7.5. Double Quoted Line Breaks': {
      src: `"folded
to a space,\t

to a line feed, or \t\\
 \\ \tnon-content"`,
      tgt: ['folded to a space,\nto a line feed, or \t \tnon-content']
    },

    'Example 7.6. Double Quoted Lines': {
      src: `" 1st non-empty

 2nd non-empty
\t3rd non-empty "`,
      tgt: [' 1st non-empty\n2nd non-empty 3rd non-empty ']
    }
  },

  '7.3.2. Single-Quoted Style': {
    'Example 7.7. Single Quoted Characters': {
      src: ` 'here''s to "quotes"'`,
      tgt: ['here\'s to "quotes"']
    },

    'Example 7.8. Single Quoted Implicit Keys': {
      src: `'implicit block key' : [
  'implicit flow key' : value,
 ]`,
      tgt: [{ 'implicit block key': [{ 'implicit flow key': 'value' }] }]
    },

    'Example 7.9. Single Quoted Lines': {
      src: `' 1st non-empty

 2nd non-empty\t
\t3rd non-empty '`,
      tgt: [' 1st non-empty\n2nd non-empty 3rd non-empty ']
    }
  },

  '7.3.3. Plain Style': {
    'Example 7.10. Plain Characters': {
      src: `# Outside flow collection:
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
      tgt: [
        [
          '::vector',
          ': - ()',
          'Up, up, and away!',
          -123,
          'http://example.com/foo#bar',
          [
            '::vector',
            ': - ()',
            'Up, up and away!',
            -123,
            'http://example.com/foo#bar'
          ]
        ]
      ]
    },

    'Example 7.11. Plain Implicit Keys': {
      src: `implicit block key : [
  implicit flow key : value,
 ]`,
      tgt: [{ 'implicit block key': [{ 'implicit flow key': 'value' }] }]
    },

    'Example 7.12. Plain Lines': {
      src: `1st non-empty

 2nd non-empty
\t3rd non-empty`,
      tgt: ['1st non-empty\n2nd non-empty 3rd non-empty']
    }
  },

  '7.4.1. Flow Sequences': {
    'Example 7.13. Flow Sequence': {
      src: `- [ one, two, ]
- [three ,four]`,
      tgt: [
        [
          ['one', 'two'],
          ['three', 'four']
        ]
      ]
    },

    'Example 7.14. Flow Sequence Entries': {
      src: `[
"double
 quoted", 'single
           quoted',
plain
 text, [ nested ],
single: pair,
]`,
      tgt: [
        [
          'double quoted',
          'single quoted',
          'plain text',
          ['nested'],
          { single: 'pair' }
        ]
      ]
    }
  },

  '7.4.2. Flow Mappings': {
    'Example 7.15. Flow Mappings': {
      src: `- { one : two , three: four , }
- {five: six,seven : eight}`,
      tgt: [
        [
          { one: 'two', three: 'four' },
          { five: 'six', seven: 'eight' }
        ]
      ]
    },

    'Example 7.16. Flow Mapping Entries': {
      src: `{
? explicit: entry,
implicit: entry,
?
}`,
      tgt: [{ explicit: 'entry', implicit: 'entry', '': null }]
    },

    'Example 7.17. Flow Mapping Separate Values': {
      src: `{
unquoted : "separate",
http://foo.com,
omitted value:,
: omitted key,
}`,
      tgt: [
        {
          unquoted: 'separate',
          'http://foo.com': null,
          'omitted value': null,
          '': 'omitted key'
        }
      ]
    },

    'Example 7.18. Flow Mapping Adjacent Values': {
      src: `{
"adjacent":value,
"readable": value,
"empty":
}`,
      tgt: [{ adjacent: 'value', readable: 'value', empty: null }]
    },

    'Example 7.19. Single Pair Flow Mappings': {
      src: `[
foo: bar
]`,
      tgt: [[{ foo: 'bar' }]]
    },

    'Example 7.20. Single Pair Explicit Entry': {
      src: `[
? foo
 bar : baz
]`,
      tgt: [[{ 'foo bar': 'baz' }]]
    },

    'Example 7.21. Single Pair Implicit Entries': {
      src: `- [ YAML : separate ]
- [ : empty key entry ]
- [ {JSON: like}:adjacent ]`,
      tgt: [
        [
          [{ YAML: 'separate' }],
          [{ '': 'empty key entry' }],
          [{ '{ JSON: like }': 'adjacent' }]
        ]
      ],
      warnings: [[collectionKeyWarning]]
    },

    'Example 7.22. Invalid Implicit Keys': {
      src: `[ foo
 bar: invalid,
 "foo ${'x'.repeat(1024)} bar": invalid ]`,
      tgt: [
        [
          { 'foo bar': 'invalid' },
          {
            'foo xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx bar':
              'invalid'
          }
        ]
      ],
      errors: [
        [
          'The "foo xxxx...xxxx bar" key is too long'
          // ERROR: The foo bar key spans multiple lines
        ]
      ]
    }
  },

  '7.5. Flow Nodes': {
    'Example 7.23. Flow Content': {
      src: `- [ a, b ]
- { a: b }
- "a"
- 'b'
- c`,
      tgt: [[['a', 'b'], { a: 'b' }, 'a', 'b', 'c']]
    },

    'Example 7.24. Flow Nodes': {
      src: `- !!str "a"
- 'b'
- &anchor "c"
- *anchor
- !!str`,
      tgt: [['a', 'b', 'c', 'c', '']]
    }
  },

  '8.1.1. Block Scalar Headers': {
    'Example 8.1. Block Scalar Header': {
      src: `- | # Empty header
 literal
- >1 # Indentation indicator
  folded
- |+ # Chomping indicator
 keep

- >1- # Both indicators
  strip`,
      tgt: [['literal\n', ' folded\n', 'keep\n\n', ' strip']]
    },

    'Example 8.2. Block Indentation Indicator': {
      src: `- |
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
      tgt: [['detected\n', '\n\n# detected\n', ' explicit\n', '\t\ndetected\n']]
    },

    'Example 8.3. Invalid Block Scalar Indentation Indicators': {
      src: `- |
··
·text
---
- >
··text
·text
---
- |2
·text`.replace(/·/g, ' '),
      tgt: [
        [[''], 'text'],
        [['text\n'], 'text'],
        [[''], 'text']
      ],
      errors: [
        ['Document is not valid YAML (bad indentation?)'],
        ['Document is not valid YAML (bad indentation?)'],
        ['Document is not valid YAML (bad indentation?)']
      ]
    },

    'Example 8.4. Chomping Final Line Break': {
      src: `strip: |-
  text
clip: |
  text
keep: |+
  text\n`,
      tgt: [{ strip: 'text', clip: 'text\n', keep: 'text\n' }]
    },

    'Example 8.5. Chomping Trailing Lines': {
      src: `
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
      tgt: [{ strip: '# text', clip: '# text\n', keep: '# text\n\n' }]
    },

    'Example 8.6. Empty Scalar Chomping': {
      src: `strip: >-

clip: >

keep: |+\n\n`,
      tgt: [{ strip: '', clip: '', keep: '\n' }]
    }
  },

  '8.1.2. Literal Style': {
    'Example 8.7. Literal Scalar': {
      src: `|
 literal
 \ttext\n\n`,
      tgt: ['literal\n\ttext\n']
    },

    'Example 8.8. Literal Content': {
      src: `|
·
··
··literal
···
··
··text

·# Comment`.replace(/·/g, ' '),
      tgt: ['\n\nliteral\n \n\ntext\n']
    }
  },

  '8.1.3. Folded Style': {
    'Example 8.9. Folded Scalar': {
      src: `>
 folded
 text\n\n`,
      tgt: ['folded text\n']
    },

    'Example 8.10. Folded Lines': {
      src: `>

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
      tgt: [
        `
folded line
next line
  * bullet

  * list
  * lines

last line
`
      ]
    }
  },

  '8.2.1. Block Sequences': {
    'Example 8.14. Block Sequence': {
      src: `block sequence:
  - one
  - two : three\n`,
      tgt: [{ 'block sequence': ['one', { two: 'three' }] }]
    },

    'Example 8.15. Block Sequence Entry Types': {
      src: `- # Empty
- |
 block node
- - one # Compact
  - two # sequence
- one: two # Compact mapping`,
      tgt: [[null, 'block node\n', ['one', 'two'], { one: 'two' }]]
    }
  },

  '8.2.2. Block Mappings': {
    'Example 8.16. Block Mappings': {
      src: `block mapping:
 key: value\n`,
      tgt: [{ 'block mapping': { key: 'value' } }]
    },

    'Example 8.17. Explicit Block Mapping Entries': {
      src: `? explicit key # Empty value
? |
  block key
: - one # Explicit compact
  - two # block value\n`,
      tgt: [
        {
          'explicit key': null, // FIXME: maybe ''?
          'block key\n': ['one', 'two']
        }
      ]
    },

    'Example 8.18. Implicit Block Mapping Entries': {
      src: `plain key: in-line value
: # Both empty
"quoted key":
- entry`,
      tgt: [
        {
          'plain key': 'in-line value',
          '': null,
          'quoted key': ['entry']
        }
      ]
    },

    'Example 8.19. Compact Block Mappings': {
      src: `- sun: yellow
- ? earth: blue
  : moon: white\n`,
      tgt: [[{ sun: 'yellow' }, { '{ earth: blue }': { moon: 'white' } }]],
      warnings: [[collectionKeyWarning]]
    }
  },

  '8.2.3. Block Nodes': {
    'Example 8.20. Block Types': {
      src: `-
  "flow in block"
- >
 Block scalar
- !!map # Block collection
  foo : bar\n`,
      tgt: [['flow in block', 'Block scalar\n', { foo: 'bar' }]]
    },

    'Example 8.21. Block Scalar Nodes': {
      src: `literal: |2
  value
folded:
   !foo
  >1
 value`,
      tgt: [{ literal: 'value\n', folded: 'value\n' }],
      warnings: [
        ['The tag !foo is unavailable, falling back to tag:yaml.org,2002:str']
      ],
      special: src => {
        const tag = {
          tag: '!foo',
          resolve: (doc, node) => 'foo' + node.strValue
        }
        const res = YAML.parse(src, { customTags: [tag] })
        expect(res).toMatchObject({ literal: 'value\n', folded: 'foovalue\n' })
      }
    },

    'Example 8.22. Block Collection Nodes': {
      src: `sequence: !!seq
- entry
- !!seq
 - nested
mapping: !!map
 foo: bar`,
      tgt: [
        {
          sequence: ['entry', ['nested']],
          mapping: { foo: 'bar' }
        }
      ],
      special: src => {
        const doc = YAML.parseDocument(src)
        expect(doc.contents.tag).toBeUndefined()
        expect(doc.contents.items[0].value.tag).toBe('tag:yaml.org,2002:seq')
        expect(doc.contents.items[0].value.items[1].tag).toBe(
          'tag:yaml.org,2002:seq'
        )
        expect(doc.contents.items[1].value.tag).toBe('tag:yaml.org,2002:map')
      }
    }
  },

  '9.1. Documents': {
    'Example 9.1. Document Prefix': {
      src: `\u{FEFF}# Comment
# lines
Document`,
      tgt: ['Document']
    },

    'Example 9.2. Document Markers': {
      src: `%YAML 1.2
---
Document
... # Suffix`,
      tgt: ['Document'],
      special: src => expect(YAML.parseDocument(src).version).toBe('1.2')
    },

    'Example 9.3. Bare Documents': {
      src: `Bare
document
...
# No document
...
|
%!PS-Adobe-2.0 # Not the first line`,
      tgt: ['Bare document', null, '%!PS-Adobe-2.0 # Not the first line\n']
    },

    'Example 9.4. Explicit Documents': {
      src: `---
{ matches
% : 20 }
...
---
# Empty
...`,
      tgt: [{ 'matches %': 20 }, null]
    },

    'Example 9.5. Directives Documents': {
      src: `%YAML 1.2
--- |
%!PS-Adobe-2.0
...
%YAML 1.2
---
# Empty
...`,
      tgt: ['%!PS-Adobe-2.0\n', null],
      special: src =>
        YAML.parseAllDocuments(src).forEach(doc =>
          expect(doc.version).toBe('1.2')
        )
    }
  },

  '9.2. Streams': {
    'Example 9.6. Stream': {
      src: `Document
---
# Empty
...
%YAML 1.2
---
matches %: 20`,
      tgt: ['Document', null, { 'matches %': 20 }],
      special: src => {
        const versions = YAML.parseAllDocuments(src).map(doc => doc.version)
        expect(versions).toMatchObject([null, null, '1.2'])
      }
    }
  }
}

let origFoldOptions

beforeAll(() => {
  origFoldOptions = YAML.scalarOptions.str.fold
  YAML.scalarOptions.str.fold = {
    lineWidth: 20,
    minContentWidth: 0
  }
})

afterAll(() => {
  YAML.scalarOptions.str.fold = origFoldOptions
})

for (const section in spec) {
  describe(section, () => {
    for (const name in spec[section]) {
      test(name, () => {
        const { src, tgt, errors, special, warnings } = spec[section][name]
        const documents = YAML.parseAllDocuments(src)
        const json = documents.map(doc => doc.toJSON())
        const docErrors = documents.map(doc =>
          doc.errors.map(err => err.message)
        )
        trace: name,
          '\n' + JSON.stringify(json, null, '  '),
          { errors: docErrors }
        expect(json).toMatchObject(tgt)
        documents.forEach((doc, i) => {
          if (!errors || !errors[i]) expect(doc.errors).toHaveLength(0)
          else
            errors[i].forEach((err, j) =>
              expect(doc.errors[j].message).toBe(err)
            )
          if (!warnings || !warnings[i]) expect(doc.warnings).toHaveLength(0)
          else
            warnings[i].forEach((err, j) =>
              expect(doc.warnings[j].message).toBe(err)
            )
        })
        if (special) special(src)
        if (!errors) {
          const src2 = documents.map(doc => String(doc)).join('\n...\n')
          const documents2 = YAML.parseAllDocuments(src2)
          const json2 = documents2.map(doc => doc.toJSON())
          trace: name,
            '\nIN\n' + src,
            '\nJSON\n' + JSON.stringify(json, null, '  '),
            '\n\nOUT\n' + src2,
            '\nOUT-JSON\n' + JSON.stringify(src2),
            '\nRE-JSON\n' + JSON.stringify(json2, null, '  ')
          expect(json2).toMatchObject(tgt)
        }
      })
    }
  })
}
