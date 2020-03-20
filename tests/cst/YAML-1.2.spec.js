import { Type } from '../../src/constants'
import { parse } from '../../src/cst/parse'
import { pretty, testSpec } from './common'

const spec = {
  '2.1. Collections': {
    'Example 2.1. Sequence of Scalars': {
      src: `- Mark McGwire\r
- Sammy Sosa\r
- Ken Griffey\r`,
      tgt: [
        {
          contents: [
            {
              type: Type.SEQ,
              items: [
                { type: Type.SEQ_ITEM, node: 'Mark McGwire' },
                { type: Type.SEQ_ITEM, node: 'Sammy Sosa' },
                { type: Type.SEQ_ITEM, node: 'Ken Griffey' }
              ]
            }
          ]
        }
      ]
    },

    'Example 2.2. Mapping Scalars to Scalars': {
      src: `hr:  65    # Home runs\r
avg: 0.278 # Batting average\r
rbi: 147   # Runs Batted In`,
      tgt: [
        {
          contents: [
            {
              type: Type.MAP,
              items: [
                'hr',
                {
                  type: Type.MAP_VALUE,
                  node: { comment: ' Home runs', strValue: '65' }
                },
                'avg',
                {
                  type: Type.MAP_VALUE,
                  node: { comment: ' Batting average', strValue: '0.278' }
                },
                'rbi',
                {
                  type: Type.MAP_VALUE,
                  node: { comment: ' Runs Batted In', strValue: '147' }
                }
              ]
            }
          ]
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
          contents: [
            {
              items: [
                'american',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      { type: Type.SEQ_ITEM, node: 'Boston Red Sox' },
                      { type: Type.SEQ_ITEM, node: 'Detroit Tigers' },
                      { type: Type.SEQ_ITEM, node: 'New York Yankees' }
                    ]
                  }
                },
                'national',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      { type: Type.SEQ_ITEM, node: 'New York Mets' },
                      { type: Type.SEQ_ITEM, node: 'Chicago Cubs' },
                      { type: Type.SEQ_ITEM, node: 'Atlanta Braves' }
                    ]
                  }
                }
              ]
            }
          ]
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
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      'name',
                      { type: Type.MAP_VALUE, node: 'Mark McGwire' },
                      'hr',
                      { type: Type.MAP_VALUE, node: '65' },
                      'avg',
                      { type: Type.MAP_VALUE, node: '0.278' }
                    ]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      'name',
                      { type: Type.MAP_VALUE, node: 'Sammy Sosa' },
                      'hr',
                      { type: Type.MAP_VALUE, node: '63' },
                      'avg',
                      { type: Type.MAP_VALUE, node: '0.288' }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 2.5. Sequence of Sequences': {
      src: `- [name        , hr, avg  ]
- [Mark McGwire, 65, 0.278]
- [Sammy Sosa  , 63, 0.288]`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: { items: ['[', 'name', ',', 'hr', ',', 'avg', ']'] }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: ['[', 'Mark McGwire', ',', '65', ',', '0.278', ']']
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: ['[', 'Sammy Sosa', ',', '63', ',', '0.288', ']']
                  }
                }
              ]
            }
          ]
        }
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
          contents: [
            {
              items: [
                'Mark McGwire',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: ['{', 'hr', ':', '65', ',', 'avg', ':', '0.278', '}']
                  }
                },
                'Sammy Sosa',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: ['{', 'hr', ':', '63', ',', 'avg', ':', '0.288', '}']
                  }
                }
              ]
            }
          ]
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
        {
          directives: [{ comment: ' Ranking of 1998 home runs' }],
          contents: [
            {
              items: [
                { type: Type.SEQ_ITEM, node: 'Mark McGwire' },
                { type: Type.SEQ_ITEM, node: 'Sammy Sosa' },
                { type: Type.SEQ_ITEM, node: 'Ken Griffey' }
              ]
            },
            { type: Type.BLANK_LINE },
            { comment: ' Team ranking' }
          ]
        },
        {
          contents: [
            {
              items: [
                { type: Type.SEQ_ITEM, node: 'Chicago Cubs' },
                { type: Type.SEQ_ITEM, node: 'St Louis Cardinals' }
              ]
            }
          ]
        }
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
          contents: [
            {
              items: [
                'time',
                { type: Type.MAP_VALUE, node: '20:03:20' },
                'player',
                { type: Type.MAP_VALUE, node: 'Sammy Sosa' },
                'action',
                { type: Type.MAP_VALUE, node: 'strike (miss)' }
              ]
            }
          ]
        },
        {
          contents: [
            {
              items: [
                'time',
                { type: Type.MAP_VALUE, node: '20:03:47' },
                'player',
                { type: Type.MAP_VALUE, node: 'Sammy Sosa' },
                'action',
                { type: Type.MAP_VALUE, node: 'grand slam' }
              ]
            }
          ]
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
          contents: [
            {
              items: [
                'hr',
                {
                  comment: ' 1998 hr ranking',
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      { type: Type.SEQ_ITEM, node: 'Mark McGwire' },
                      { type: Type.SEQ_ITEM, node: 'Sammy Sosa' }
                    ]
                  }
                },
                'rbi',
                {
                  comment: ' 1998 rbi ranking',
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      { type: Type.SEQ_ITEM, node: 'Sammy Sosa' },
                      { type: Type.SEQ_ITEM, node: 'Ken Griffey' }
                    ]
                  }
                }
              ]
            }
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
          contents: [
            {
              items: [
                'hr',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      { type: Type.SEQ_ITEM, node: 'Mark McGwire' },
                      { comment: ' Following node labeled SS' },
                      {
                        type: Type.SEQ_ITEM,
                        node: { anchor: 'SS', strValue: 'Sammy Sosa' }
                      }
                    ]
                  }
                },
                'rbi',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      {
                        type: Type.SEQ_ITEM,
                        node: {
                          comment: ' Subsequent occurrence',
                          type: Type.ALIAS,
                          rawValue: 'SS'
                        }
                      },
                      { type: Type.SEQ_ITEM, node: 'Ken Griffey' }
                    ]
                  }
                }
              ]
            }
          ]
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
          contents: [
            {
              items: [
                {
                  type: Type.MAP_KEY,
                  node: {
                    items: [
                      { type: Type.SEQ_ITEM, node: 'Detroit Tigers' },
                      { type: Type.SEQ_ITEM, node: 'Chicago cubs' }
                    ]
                  }
                },
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [{ type: Type.SEQ_ITEM, node: '2001-07-23' }]
                  }
                },
                { type: Type.BLANK_LINE },
                {
                  type: Type.MAP_KEY,
                  node: {
                    items: ['[', 'New York Yankees', ',', 'Atlanta Braves', ']']
                  }
                },
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      '[',
                      '2001-07-02',
                      ',',
                      '2001-08-12',
                      ',',
                      '2001-08-14',
                      ']'
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
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
        {
          contents: [
            { comment: ' Products purchased' },
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      'item',
                      { type: Type.MAP_VALUE, node: 'Super Hoop' },
                      'quantity',
                      { type: Type.MAP_VALUE, node: '1' }
                    ]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      'item',
                      { type: Type.MAP_VALUE, node: 'Basketball' },
                      'quantity',
                      { type: Type.MAP_VALUE, node: '4' }
                    ]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      'item',
                      { type: Type.MAP_VALUE, node: 'Big Shoes' },
                      'quantity',
                      { type: Type.MAP_VALUE, node: '1' }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },

  '2.3. Scalars': {
    'Example 2.13. In literals, newlines are preserved': {
      src: `# ASCII Art
--- |
  \\//||\\/||
  // ||  ||__`,
      tgt: [
        {
          directives: [{ comment: ' ASCII Art' }],
          contents: ['\\//||\\/||\n// ||  ||__\n']
        }
      ]
    },

    'Example 2.14. In the folded scalars, newlines become spaces': {
      src: `--- >
  Mark McGwire's
  year was crippled
  by a knee injury.`,
      tgt: [
        { contents: ["Mark McGwire's year was crippled by a knee injury.\n"] }
      ]
    },

    'Example 2.15. Folded newlines are preserved for "more indented" and blank lines': {
      src: `>
 Sammy Sosa completed another
 fine season with great stats.

   63 Home Runs
   0.288 Batting Average

 What a year!`,
      tgt: [
        {
          contents: [
            `Sammy Sosa completed another fine season with great stats.

  63 Home Runs
  0.288 Batting Average

What a year!\n`
          ]
        }
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
          contents: [
            {
              items: [
                'name',
                { type: Type.MAP_VALUE, node: 'Mark McGwire' },
                'accomplishment',
                {
                  type: Type.MAP_VALUE,
                  node: 'Mark set a major league home run record in 1998.\n'
                },
                'stats',
                {
                  type: Type.MAP_VALUE,
                  node: '65 Home Runs\n0.278 Batting Average\n'
                }
              ]
            }
          ]
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
          contents: [
            {
              items: [
                'unicode',
                { type: Type.MAP_VALUE, node: 'Sosa did fine.☺' },
                'control',
                { type: Type.MAP_VALUE, node: '\b1998\t1999\t2000\n' },
                'hex esc',
                { type: Type.MAP_VALUE, node: '\r\n is \r\n' },
                { type: Type.BLANK_LINE },
                'single',
                { type: Type.MAP_VALUE, node: '"Howdy!" he cried.' },
                'quoted',
                { type: Type.MAP_VALUE, node: " # Not a 'comment'." },
                'tie-fighter',
                { type: Type.MAP_VALUE, node: '|\\-*-/|' }
              ]
            }
          ]
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
          contents: [
            {
              items: [
                'plain',
                {
                  type: Type.MAP_VALUE,
                  node: 'This unquoted scalar spans many lines.'
                },
                { type: Type.BLANK_LINE },
                'quoted',
                { type: Type.MAP_VALUE, node: 'So does this quoted scalar.\n' }
              ]
            }
          ]
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
          contents: [
            {
              items: [
                'canonical',
                { type: Type.MAP_VALUE, node: '12345' },
                'decimal',
                { type: Type.MAP_VALUE, node: '+12345' },
                'octal',
                { type: Type.MAP_VALUE, node: '0o14' },
                'hexadecimal',
                { type: Type.MAP_VALUE, node: '0xC' }
              ]
            }
          ]
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
          contents: [
            {
              items: [
                'canonical',
                { type: Type.MAP_VALUE, node: '1.23015e+3' },
                'exponential',
                { type: Type.MAP_VALUE, node: '12.3015e+02' },
                'fixed',
                { type: Type.MAP_VALUE, node: '1230.15' },
                'negative infinity',
                { type: Type.MAP_VALUE, node: '-.inf' },
                'not a number',
                { type: Type.MAP_VALUE, node: '.NaN' }
              ]
            }
          ]
        }
      ]
    },

    'Example 2.21. Miscellaneous': {
      src: `null:
booleans: [ true, false ]
string: '012345'`,
      tgt: [
        {
          contents: [
            {
              items: [
                'null',
                { type: Type.MAP_VALUE, node: null },
                'booleans',
                {
                  type: Type.MAP_VALUE,
                  node: { items: ['[', 'true', ',', 'false', ']'] }
                },
                'string',
                { type: Type.MAP_VALUE, node: '012345' }
              ]
            }
          ]
        }
      ]
    },

    'Example 2.22. Timestamps': {
      src: `canonical: 2001-12-15T02:59:43.1Z
iso8601: 2001-12-14t21:59:43.10-05:00
spaced: 2001-12-14 21:59:43.10 -5
date: 2002-12-14`,
      tgt: [
        {
          contents: [
            {
              items: [
                'canonical',
                { type: Type.MAP_VALUE, node: '2001-12-15T02:59:43.1Z' },
                'iso8601',
                { type: Type.MAP_VALUE, node: '2001-12-14t21:59:43.10-05:00' },
                'spaced',
                { type: Type.MAP_VALUE, node: '2001-12-14 21:59:43.10 -5' },
                'date',
                { type: Type.MAP_VALUE, node: '2002-12-14' }
              ]
            }
          ]
        }
      ]
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
          contents: [
            {
              items: [
                'not-date',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    tag: { handle: '!!', suffix: 'str' },
                    strValue: '2002-04-28'
                  }
                },
                { type: Type.BLANK_LINE },
                'picture',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    tag: { handle: '!!', suffix: 'binary' },
                    strValue:
                      'R0lGODlhDAAMAIQAAP//9/X\n17unp5WZmZgAAAOfn515eXv\nPz7Y6OjuDg4J+fn5OTk6enp\n56enmleECcgggoBADs=\n'
                  }
                },
                { type: Type.BLANK_LINE },
                'application specific tag',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    tag: { handle: '!', suffix: 'something' },
                    strValue:
                      'The semantics of the tag\nabove may be different for\ndifferent documents.\n'
                  }
                }
              ]
            }
          ]
        }
      ]
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
        {
          directives: [
            { name: 'TAG', parameters: ['!', 'tag:clarkevans.com,2002:'] }
          ],
          contents: [
            {
              tag: { handle: '!', suffix: 'shape' },
              comment:
                ' Use the ! handle for presenting\n tag:clarkevans.com,2002:circle',
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    tag: { handle: '!', suffix: 'circle' },
                    items: [
                      'center',
                      {
                        type: Type.MAP_VALUE,
                        node: {
                          anchor: 'ORIGIN',
                          items: [
                            '{',
                            'x',
                            ':',
                            '73',
                            ',',
                            'y',
                            ':',
                            '129',
                            '}'
                          ]
                        }
                      },
                      'radius',
                      { type: Type.MAP_VALUE, node: '7' }
                    ]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    tag: { handle: '!', suffix: 'line' },
                    items: [
                      'start',
                      {
                        type: Type.MAP_VALUE,
                        node: { type: Type.ALIAS, rawValue: 'ORIGIN' }
                      },
                      'finish',
                      {
                        type: Type.MAP_VALUE,
                        node: {
                          items: [
                            '{',
                            'x',
                            ':',
                            '89',
                            ',',
                            'y',
                            ':',
                            '102',
                            '}'
                          ]
                        }
                      }
                    ]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    tag: { handle: '!', suffix: 'label' },
                    items: [
                      'start',
                      {
                        type: Type.MAP_VALUE,
                        node: { type: Type.ALIAS, rawValue: 'ORIGIN' }
                      },
                      'color',
                      { type: Type.MAP_VALUE, node: '0xFFEEBB' },
                      'text',
                      { type: Type.MAP_VALUE, node: 'Pretty vector drawing.' }
                    ]
                  }
                }
              ]
            }
          ]
        }
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
          directives: [
            { comment: ' Sets are represented as a' },
            { comment: ' Mapping where each key is' },
            { comment: ' associated with a null value' }
          ],
          contents: [
            {
              tag: { handle: '!!', suffix: 'set' },
              items: [
                { type: Type.MAP_KEY, node: 'Mark McGwire' },
                { type: Type.MAP_KEY, node: 'Sammy Sosa' },
                { type: Type.MAP_KEY, node: 'Ken Griff' }
              ]
            }
          ]
        }
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
        {
          directives: [
            { comment: ' Ordered maps are represented as' },
            { comment: ' A sequence of mappings, with' },
            { comment: ' each mapping having one key' }
          ],
          contents: [
            {
              tag: { handle: '!!', suffix: 'omap' },
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      'Mark McGwire',
                      { type: Type.MAP_VALUE, node: '65' }
                    ]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: ['Sammy Sosa', { type: Type.MAP_VALUE, node: '63' }]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: ['Ken Griffy', { type: Type.MAP_VALUE, node: '58' }]
                  }
                }
              ]
            }
          ]
        }
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
          contents: [
            {
              tag: { verbatim: 'tag:clarkevans.com,2002:invoice' },
              items: [
                'invoice',
                { type: Type.MAP_VALUE, node: '34843' },
                'date',
                { type: Type.MAP_VALUE, node: '2001-01-23' },
                'bill-to',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    anchor: 'id001',
                    items: [
                      'given',
                      { type: Type.MAP_VALUE, node: 'Chris' },
                      'family',
                      { type: Type.MAP_VALUE, node: 'Dumars' },
                      'address',
                      {
                        type: Type.MAP_VALUE,
                        node: {
                          items: [
                            'lines',
                            {
                              type: Type.MAP_VALUE,
                              node: '458 Walkman Dr.\nSuite #292\n'
                            },
                            'city',
                            { type: Type.MAP_VALUE, node: 'Royal Oak' },
                            'state',
                            { type: Type.MAP_VALUE, node: 'MI' },
                            'postal',
                            { type: Type.MAP_VALUE, node: '48046' }
                          ]
                        }
                      }
                    ]
                  }
                },
                'ship-to',
                {
                  type: Type.MAP_VALUE,
                  node: { type: Type.ALIAS, rawValue: 'id001' }
                },
                'product',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      {
                        type: Type.SEQ_ITEM,
                        node: {
                          items: [
                            'sku',
                            { type: Type.MAP_VALUE, node: 'BL394D' },
                            'quantity',
                            { type: Type.MAP_VALUE, node: '4' },
                            'description',
                            { type: Type.MAP_VALUE, node: 'Basketball' },
                            'price',
                            { type: Type.MAP_VALUE, node: '450.00' }
                          ]
                        }
                      },
                      {
                        type: Type.SEQ_ITEM,
                        node: {
                          items: [
                            'sku',
                            { type: Type.MAP_VALUE, node: 'BL4438H' },
                            'quantity',
                            { type: Type.MAP_VALUE, node: '1' },
                            'description',
                            { type: Type.MAP_VALUE, node: 'Super Hoop' },
                            'price',
                            { type: Type.MAP_VALUE, node: '2392.00' }
                          ]
                        }
                      }
                    ]
                  }
                },
                'tax',
                { type: Type.MAP_VALUE, node: '251.42' },
                'total',
                { type: Type.MAP_VALUE, node: '4443.52' },
                'comments',
                {
                  type: Type.MAP_VALUE,
                  node:
                    'Late afternoon is best. Backup contact is Nancy Billsmer @ 338-4338.'
                }
              ]
            }
          ]
        }
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
          contents: [
            {
              items: [
                'Time',
                { type: Type.MAP_VALUE, node: '2001-11-23 15:01:42 -5' },
                'User',
                { type: Type.MAP_VALUE, node: 'ed' },
                'Warning',
                {
                  type: Type.MAP_VALUE,
                  node: 'This is an error message for the log file'
                }
              ]
            }
          ]
        },
        {
          contents: [
            {
              items: [
                'Time',
                { type: Type.MAP_VALUE, node: '2001-11-23 15:02:31 -5' },
                'User',
                { type: Type.MAP_VALUE, node: 'ed' },
                'Warning',
                {
                  type: Type.MAP_VALUE,
                  node: 'A slightly different error message.'
                }
              ]
            }
          ]
        },
        {
          contents: [
            {
              items: [
                'Date',
                { type: Type.MAP_VALUE, node: '2001-11-23 15:03:17 -5' },
                'User',
                { type: Type.MAP_VALUE, node: 'ed' },
                'Fatal',
                { type: Type.MAP_VALUE, node: 'Unknown variable "bar"' },
                'Stack',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      {
                        type: Type.SEQ_ITEM,
                        node: {
                          items: [
                            'file',
                            { type: Type.MAP_VALUE, node: 'TopClass.py' },
                            'line',
                            { type: Type.MAP_VALUE, node: '23' },
                            'code',
                            {
                              type: Type.MAP_VALUE,
                              node: 'x = MoreObject("345\\n")\n'
                            }
                          ]
                        }
                      },
                      {
                        type: Type.SEQ_ITEM,
                        node: {
                          items: [
                            'file',
                            { type: Type.MAP_VALUE, node: 'MoreClass.py' },
                            'line',
                            { type: Type.MAP_VALUE, node: '58' },
                            'code',
                            { type: Type.MAP_VALUE, node: 'foo = bar' }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
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
          contents: [
            {
              items: [
                'sequence',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      { type: Type.SEQ_ITEM, node: 'one' },
                      { type: Type.SEQ_ITEM, node: 'two' }
                    ]
                  }
                },
                'mapping',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      { type: Type.MAP_KEY, node: 'sky' },
                      { type: Type.MAP_VALUE, node: 'blue' },
                      'sea',
                      { type: Type.MAP_VALUE, node: 'green' }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 5.4. Flow Collection Indicators': {
      src: `sequence: [ one, two, ]
mapping: { sky: blue, sea: green }`,
      tgt: [
        {
          contents: [
            {
              items: [
                'sequence',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: ['[', 'one', ',', 'two', ',', ']']
                  }
                },
                'mapping',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      '{',
                      'sky',
                      ':',
                      'blue',
                      ',',
                      'sea',
                      ':',
                      'green',
                      '}'
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 5.5. Comment Indicator': {
      src: `# Comment only.`,
      tgt: [{ contents: [{ comment: ' Comment only.' }] }]
    },

    'Example 5.6. Node Property Indicators': {
      src: `anchored: !local &anchor value
alias: *anchor`,
      tgt: [
        {
          contents: [
            {
              items: [
                'anchored',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    tag: { handle: '!', suffix: 'local' },
                    anchor: 'anchor',
                    strValue: 'value'
                  }
                },
                'alias',
                {
                  type: Type.MAP_VALUE,
                  node: { type: Type.ALIAS, rawValue: 'anchor' }
                }
              ]
            }
          ]
        }
      ]
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
          contents: [
            {
              items: [
                'literal',
                { type: Type.MAP_VALUE, node: 'some\ntext\n' },
                'folded',
                { type: Type.MAP_VALUE, node: 'some text\n' }
              ]
            }
          ]
        }
      ]
    },

    'Example 5.8. Quoted Scalar Indicators': {
      src: `single: 'text'
double: "text"`,
      tgt: [
        {
          contents: [
            {
              items: [
                'single',
                { type: Type.MAP_VALUE, node: 'text' },
                'double',
                { type: Type.MAP_VALUE, node: 'text' }
              ]
            }
          ]
        }
      ]
    },

    'Example 5.9. Directive Indicator': {
      src: `%YAML 1.2
--- text`,
      tgt: [
        {
          directives: [{ name: 'YAML', parameters: ['1.2'] }],
          contents: ['text']
        }
      ]
    },

    'Example 5.10. Invalid use of Reserved Indicators': {
      src: `commercial-at: @text
grave-accent: \`text`,
      tgt: [
        {
          contents: [
            {
              items: [
                'commercial-at',
                { type: Type.MAP_VALUE, node: '@text' },
                'grave-accent',
                { type: Type.MAP_VALUE, node: '`text' }
              ]
            }
          ]
        }
      ]
      // ERROR: Reserved indicators can't start a plain scalar.
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
          contents: [
            { comment: ' Tabs and spaces' },
            {
              items: [
                'quoted',
                { type: Type.MAP_VALUE, node: 'Quoted \t' },
                'block',
                {
                  type: Type.MAP_VALUE,
                  node: 'void main() {\n\tprintf("Hello, world!\\n");\n}\n'
                }
              ]
            }
          ]
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
        {
          contents: [
            'Fun with \x5C \x22 \x07 \x08 \x1B \x0C \x0A \x0D \x09 \x0B \x00 \x20 \xA0 \x85 \u2028 \u2029 A A A'
          ]
        }
      ]
    },

    'Example 5.14. Invalid Escaped Characters': {
      src: `Bad escapes:
  "\\c
  \\xq-"`,
      tgt: [
        {
          contents: [
            {
              items: [
                'Bad escapes',
                { type: Type.MAP_VALUE, node: { rawValue: '"\\c\n  \\xq-"' } }
              ]
            }
          ]
        }
      ]
      // ERROR: c is an invalid escaped character.
      // ERROR: q and - are invalid hex digits.
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
          contents: [
            { comment: ' Leading comment line spaces are' },
            { comment: ' neither content nor indentation.' },
            { type: Type.BLANK_LINE },
            {
              items: [
                'Not indented',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      'By one space',
                      { type: Type.MAP_VALUE, node: 'By four\n  spaces\n' },
                      'Flow style',
                      {
                        type: Type.MAP_VALUE,
                        node: {
                          items: [
                            '[',
                            { comment: ' Leading spaces' },
                            'By two',
                            ',',
                            { comment: ' in flow style' },
                            'Also by two',
                            ',',
                            { comment: ' are neither' },
                            {
                              strValue: 'Still by two',
                              comment: ' content nor'
                            },
                            ']'
                          ],
                          comment: ' indentation.'
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 6.2. Indentation Indicators': {
      src: `? a
: -\tb
  -  -\tc
     - d`,
      tgt: [
        {
          contents: [
            {
              items: [
                { type: Type.MAP_KEY, node: 'a' },
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      { type: Type.SEQ_ITEM, node: 'b' },
                      {
                        type: Type.SEQ_ITEM,
                        node: {
                          items: [
                            { type: Type.SEQ_ITEM, node: 'c' },
                            { type: Type.SEQ_ITEM, node: 'd' }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },

  '6.2. Separation Spaces': {
    'Example 6.3. Separation Spaces': {
      src: `- foo:\t bar
- - baz
  -\tbaz`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: ['foo', { type: Type.MAP_VALUE, node: 'bar' }]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      { type: Type.SEQ_ITEM, node: 'baz' },
                      { type: Type.SEQ_ITEM, node: 'baz' }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
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
          contents: [
            {
              items: [
                'plain',
                { type: Type.MAP_VALUE, node: 'text lines' },
                'quoted',
                { type: Type.MAP_VALUE, node: 'text lines' },
                'block',
                { type: Type.MAP_VALUE, node: 'text\n \tlines\n' }
              ]
            }
          ]
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
          contents: [
            {
              items: [
                'Folding',
                { type: Type.MAP_VALUE, node: 'Empty line\nas a line feed' },
                'Chomping',
                { type: Type.MAP_VALUE, node: 'Clipped empty lines\n' }
              ]
            }
          ]
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
      tgt: [{ contents: ['trimmed\n\n\nas space'] }]
    },

    'Example 6.7. Block Folding': {
      src: `>
··foo·
·
··\t·bar

··baz\n`.replace(/·/g, ' '),
      tgt: [{ contents: ['foo \n\n\t bar\n\nbaz\n'] }]
    },

    'Example 6.8. Flow Folding': {
      src: `"
  foo\t
\t
  \t bar

  baz
"`,
      tgt: [{ contents: [' foo\nbar\nbaz '] }]
    }
  },

  '6.6. Comments': {
    'Example 6.9. Separated Comment': {
      src: `key:    # Comment
  value`,
      tgt: [
        {
          contents: [
            {
              items: [
                'key',
                { type: Type.MAP_VALUE, comment: ' Comment', node: 'value' }
              ]
            }
          ]
        }
      ]
    },

    'Example 6.10. Comment Lines': {
      src: `  # Comment
   \n\n`,
      tgt: [{ contents: [{ comment: ' Comment' }] }]
    },

    'Example 6.11. Multi-Line Comments': {
      src: `key:    # Comment
        # lines
  value\n`,
      tgt: [
        {
          contents: [
            {
              items: [
                'key',
                {
                  type: Type.MAP_VALUE,
                  comment: ' Comment\n lines',
                  node: 'value'
                }
              ]
            }
          ]
        }
      ]
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
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  items: [
                    '{',
                    'first',
                    ':',
                    'Sammy',
                    ',',
                    'last',
                    ':',
                    'Sosa',
                    '}'
                  ]
                },
                {
                  type: Type.MAP_VALUE,
                  comment: ' Statistics:',
                  node: {
                    items: [
                      'hr',
                      {
                        type: Type.MAP_VALUE,
                        comment: ' Home runs',
                        node: '65'
                      },
                      'avg',
                      {
                        type: Type.MAP_VALUE,
                        comment: ' Average',
                        node: '0.278'
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },
  '6.8. Directives': {
    'Example 6.13. Reserved Directives': {
      src: `%FOO  bar baz # Should be ignored
# with a warning.
--- "foo"`,
      tgt: [
        {
          directives: [
            {
              name: 'FOO',
              parameters: ['bar', 'baz'],
              comment: ' Should be ignored'
            },
            { comment: ' with a warning.' }
          ],
          contents: ['foo']
        }
      ]
    }
  },
  '6.8.1. “YAML” Directives': {
    'Example 6.14. “YAML” directive': {
      src: `%YAML 1.3 # Attempt parsing
           # with a warning
---
"foo"`,
      tgt: [
        {
          directives: [
            { name: 'YAML', parameters: ['1.3'], comment: ' Attempt parsing' },
            { comment: ' with a warning' }
          ],
          contents: ['foo']
        }
      ]
    },

    'Example 6.15. Invalid Repeated YAML directive': {
      src: `%YAML 1.2
%YAML 1.1
foo`,
      tgt: [
        {
          directives: [
            { name: 'YAML', parameters: ['1.2'] },
            { name: 'YAML', parameters: ['1.1'] }
          ],
          contents: ['foo']
        }
      ]
      // ERROR: The YAML directive must only be given at most once per document.
    }
  },
  '6.8.2. “TAG” Directives': {
    'Example 6.16. “TAG” directive': {
      src: `%TAG !yaml! tag:yaml.org,2002:
---
!yaml!str "foo"`,
      tgt: [
        {
          directives: [
            { name: 'TAG', parameters: ['!yaml!', 'tag:yaml.org,2002:'] }
          ],
          contents: [
            { tag: { handle: '!yaml!', suffix: 'str' }, strValue: 'foo' }
          ]
        }
      ]
    },

    'Example 6.17. Invalid Repeated TAG directive': {
      src: `%TAG ! !foo
%TAG ! !foo
bar`,
      tgt: [
        {
          directives: [
            { name: 'TAG', parameters: ['!', '!foo'] },
            { name: 'TAG', parameters: ['!', '!foo'] }
          ],
          contents: ['bar']
        }
      ]
      // ERROR: The TAG directive must only be given at most once per handle in the same document.
    },

    'Example 6.18. Primary Tag Handle': {
      src: `# Private
!foo "bar"
...
# Global
%TAG ! tag:example.com,2000:app/
---
!foo "bar"`,
      tgt: [
        {
          contents: [
            { comment: ' Private' },
            { tag: { handle: '!', suffix: 'foo' }, strValue: 'bar' }
          ]
        },
        {
          directives: [
            { comment: ' Global' },
            { name: 'TAG', parameters: ['!', 'tag:example.com,2000:app/'] }
          ],
          contents: [{ tag: { handle: '!', suffix: 'foo' }, strValue: 'bar' }]
        }
      ]
    },

    'Example 6.19. Secondary Tag Handle': {
      src: `%TAG !! tag:example.com,2000:app/
---
!!int 1 - 3 # Interval, not integer`,
      tgt: [
        {
          directives: [
            { name: 'TAG', parameters: ['!!', 'tag:example.com,2000:app/'] }
          ],
          contents: [
            {
              tag: { handle: '!!', suffix: 'int' },
              strValue: '1 - 3',
              comment: ' Interval, not integer'
            }
          ]
        }
      ]
    },

    'Example 6.20. Tag Handles': {
      src: `%TAG !e! tag:example.com,2000:app/
---
!e!foo "bar"`,
      tgt: [
        {
          directives: [
            { name: 'TAG', parameters: ['!e!', 'tag:example.com,2000:app/'] }
          ],
          contents: [{ tag: { handle: '!e!', suffix: 'foo' }, strValue: 'bar' }]
        }
      ]
    },

    'Example 6.21. Local Tag Prefix': {
      src: `%TAG !m! !my-
--- # Bulb here
!m!light fluorescent
...
%TAG !m! !my-
--- # Color here
!m!light green`,
      tgt: [
        {
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
        }
      ]
    },

    'Example 6.22. Global Tag Prefix': {
      src: `%TAG !e! tag:example.com,2000:app/
---
- !e!foo "bar"`,
      tgt: [
        {
          directives: [
            { name: 'TAG', parameters: ['!e!', 'tag:example.com,2000:app/'] }
          ],
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    tag: { handle: '!e!', suffix: 'foo' },
                    strValue: 'bar'
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },
  '6.9. Node Properties': {
    'Example 6.23. Node Properties': {
      src: `!!str &a1 "foo":
  !!str bar
&a2 baz : *a1`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  tag: { handle: '!!', suffix: 'str' },
                  anchor: 'a1',
                  strValue: 'foo'
                },
                {
                  type: Type.MAP_VALUE,
                  node: {
                    tag: { handle: '!!', suffix: 'str' },
                    strValue: 'bar'
                  }
                },
                { anchor: 'a2', strValue: 'baz' },
                {
                  type: Type.MAP_VALUE,
                  node: { type: Type.ALIAS, rawValue: 'a1' }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 6.24. Verbatim Tags': {
      src: `!<tag:yaml.org,2002:str> foo :
  !<!bar> baz`,
      tgt: [
        {
          contents: [
            {
              items: [
                { tag: { verbatim: 'tag:yaml.org,2002:str' }, strValue: 'foo' },
                {
                  type: Type.MAP_VALUE,
                  node: { tag: { verbatim: '!bar' }, strValue: 'baz' }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 6.25. Invalid Verbatim Tags': {
      src: `- !<!> foo
- !<$:?> bar`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: { tag: { verbatim: '!' }, strValue: 'foo' }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: { tag: { verbatim: '$:?' }, strValue: 'bar' }
                }
              ]
            }
          ]
        }
      ]
      // ERROR: Verbatim tags aren't resolved, so ! is invalid.
      // ERROR: The $:? tag is neither a global URI tag nor a local tag starting with “!”.
    },

    'Example 6.26. Tag Shorthands': {
      src: `%TAG !e! tag:example.com,2000:app/
---
- !local foo
- !!str bar
- !e!tag%21 baz`,
      tgt: [
        {
          directives: [
            { name: 'TAG', parameters: ['!e!', 'tag:example.com,2000:app/'] }
          ],
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    tag: { handle: '!', suffix: 'local' },
                    strValue: 'foo'
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    tag: { handle: '!!', suffix: 'str' },
                    strValue: 'bar'
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    tag: { handle: '!e!', suffix: 'tag%21' },
                    strValue: 'baz'
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 6.27. Invalid Tag Shorthands': {
      src: `%TAG !e! tag:example,2000:app/
---
- !e! foo
- !h!bar baz`,
      tgt: [
        {
          directives: [
            { name: 'TAG', parameters: ['!e!', 'tag:example,2000:app/'] }
          ],
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: { tag: { handle: '!e!', suffix: '' }, strValue: 'foo' }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    tag: { handle: '!h!', suffix: 'bar' },
                    strValue: 'baz'
                  }
                }
              ]
            }
          ]
        }
      ]
      // ERROR: The !e! handle has no suffix.
      // ERROR: The !h! handle wasn't declared.
    },

    'Example 6.28. Non-Specific Tags': {
      src: `# Assuming conventional resolution:
- "12"
- 12
- ! 12`,
      tgt: [
        {
          contents: [
            { comment: ' Assuming conventional resolution:' },
            {
              items: [
                { type: Type.SEQ_ITEM, node: '12' },
                { type: Type.SEQ_ITEM, node: '12' },
                {
                  type: Type.SEQ_ITEM,
                  node: { tag: { handle: '!', suffix: '' }, strValue: '12' }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 6.29. Node Anchors': {
      src: `First occurrence: &anchor Value
Second occurrence: *anchor`,
      tgt: [
        {
          contents: [
            {
              items: [
                'First occurrence',
                {
                  type: Type.MAP_VALUE,
                  node: { anchor: 'anchor', strValue: 'Value' }
                },
                'Second occurrence',
                {
                  type: Type.MAP_VALUE,
                  node: { type: Type.ALIAS, rawValue: 'anchor' }
                }
              ]
            }
          ]
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
          contents: [
            {
              items: [
                'First occurrence',
                {
                  type: Type.MAP_VALUE,
                  node: { anchor: 'anchor', strValue: 'Foo' }
                },
                'Second occurrence',
                {
                  type: Type.MAP_VALUE,
                  node: { type: Type.ALIAS, rawValue: 'anchor' }
                },
                'Override anchor',
                {
                  type: Type.MAP_VALUE,
                  node: { anchor: 'anchor', strValue: 'Bar' }
                },
                'Reuse anchor',
                {
                  type: Type.MAP_VALUE,
                  node: { type: Type.ALIAS, rawValue: 'anchor' }
                }
              ]
            }
          ]
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
      tgt: [
        {
          contents: [
            {
              items: [
                '{',
                'foo',
                ':',
                { tag: { handle: '!!', suffix: 'str' } },
                ',',
                { tag: { handle: '!!', suffix: 'str' } },
                ':',
                'bar',
                ',',
                '}'
              ]
            }
          ]
        }
      ]
    },

    'Example 7.3. Completely Empty Flow Nodes': {
      src: `{
  ? foo :,
  : bar,
}`,
      tgt: [
        {
          contents: [
            { items: ['{', '?', 'foo', ':', ',', ':', 'bar', ',', '}'] }
          ]
        }
      ]
    }
  },

  '7.3.1. Double-Quoted Style': {
    'Example 7.4. Double Quoted Implicit Keys': {
      src: `"implicit block key" : [
  "implicit flow key" : value,
 ]`,
      tgt: [
        {
          contents: [
            {
              items: [
                'implicit block key',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: ['[', 'implicit flow key', ':', 'value', ',', ']']
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 7.5. Double Quoted Line Breaks': {
      src: `"folded
to a space,\t

to a line feed, or \t\\
 \\ \tnon-content"`,
      tgt: [
        {
          contents: ['folded to a space,\nto a line feed, or \t \tnon-content']
        }
      ]
    },

    'Example 7.6. Double Quoted Lines': {
      src: `" 1st non-empty

 2nd non-empty
\t3rd non-empty "`,
      tgt: [{ contents: [' 1st non-empty\n2nd non-empty 3rd non-empty '] }]
    }
  },

  '7.3.2. Single-Quoted Style': {
    'Example 7.7. Single Quoted Characters': {
      src: ` 'here''s to "quotes"'`,
      tgt: [{ contents: ['here\'s to "quotes"'] }]
    },

    'Example 7.8. Single Quoted Implicit Keys': {
      src: `'implicit block key' : [
  'implicit flow key' : value,
 ]`,
      tgt: [
        {
          contents: [
            {
              items: [
                'implicit block key',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: ['[', 'implicit flow key', ':', 'value', ',', ']']
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 7.9. Single Quoted Lines': {
      src: `' 1st non-empty

 2nd non-empty\t
\t3rd non-empty '`,
      tgt: [{ contents: [' 1st non-empty\n2nd non-empty 3rd non-empty '] }]
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
        {
          contents: [
            { comment: ' Outside flow collection:' },
            {
              items: [
                { type: Type.SEQ_ITEM, node: '::vector' },
                { type: Type.SEQ_ITEM, node: ': - ()' },
                { type: Type.SEQ_ITEM, node: 'Up, up, and away!' },
                { type: Type.SEQ_ITEM, node: '-123' },
                { type: Type.SEQ_ITEM, node: 'http://example.com/foo#bar' },
                { comment: ' Inside flow collection:' },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      '[',
                      '::vector',
                      ',',
                      ': - ()',
                      ',',
                      'Up, up and away!',
                      ',',
                      '-123',
                      ',',
                      'http://example.com/foo#bar',
                      ']'
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 7.11. Plain Implicit Keys': {
      src: `implicit block key : [
  implicit flow key : value,
 ]`,
      tgt: [
        {
          contents: [
            {
              items: [
                'implicit block key',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: ['[', 'implicit flow key', ':', 'value', ',', ']']
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 7.12. Plain Lines': {
      src: `1st non-empty

 2nd non-empty
\t3rd non-empty`,
      tgt: [{ contents: ['1st non-empty\n2nd non-empty 3rd non-empty'] }]
    }
  },

  '7.4.1. Flow Sequences': {
    'Example 7.13. Flow Sequence': {
      src: `- [ one, two, ]
- [three ,four]`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: { items: ['[', 'one', ',', 'two', ',', ']'] }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: { items: ['[', 'three', ',', 'four', ']'] }
                }
              ]
            }
          ]
        }
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
        {
          contents: [
            {
              items: [
                '[',
                'double quoted',
                ',',
                'single quoted',
                ',',
                'plain text',
                ',',
                { items: ['[', 'nested', ']'] },
                ',',
                'single',
                ':',
                'pair',
                ',',
                ']'
              ]
            }
          ]
        }
      ]
    }
  },

  '7.4.2. Flow Mappings': {
    'Example 7.15. Flow Mappings': {
      src: `- { one : two , three: four , }
- {five: six,seven : eight}`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      '{',
                      'one',
                      ':',
                      'two',
                      ',',
                      'three',
                      ':',
                      'four',
                      ',',
                      '}'
                    ]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      '{',
                      'five',
                      ':',
                      'six',
                      ',',
                      'seven',
                      ':',
                      'eight',
                      '}'
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 7.16. Flow Mapping Entries': {
      src: `{
? explicit: entry,
implicit: entry,
?
}`,
      tgt: [
        {
          contents: [
            {
              items: [
                '{',
                '?',
                'explicit',
                ':',
                'entry',
                ',',
                'implicit',
                ':',
                'entry',
                ',',
                '?',
                '}'
              ]
            }
          ]
        }
      ]
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
          contents: [
            {
              items: [
                '{',
                'unquoted',
                ':',
                'separate',
                ',',
                'http://foo.com',
                ',',
                'omitted value',
                ':',
                ',',
                ':',
                'omitted key',
                ',',
                '}'
              ]
            }
          ]
        }
      ]
    },

    'Example 7.18. Flow Mapping Adjacent Values': {
      src: `{
"adjacent":value,
"readable": value,
"empty":
}`,
      tgt: [
        {
          contents: [
            {
              items: [
                '{',
                'adjacent',
                ':',
                'value',
                ',',
                'readable',
                ':',
                'value',
                ',',
                'empty',
                ':',
                '}'
              ]
            }
          ]
        }
      ]
    },

    'Example 7.19. Single Pair Flow Mappings': {
      src: `[
foo: bar
]`,
      tgt: [{ contents: [{ items: ['[', 'foo', ':', 'bar', ']'] }] }]
    },

    'Example 7.20. Single Pair Explicit Entry': {
      src: `[
? foo
 bar : baz
]`,
      tgt: [{ contents: [{ items: ['[', '?', 'foo bar', ':', 'baz', ']'] }] }]
    },

    'Example 7.21. Single Pair Implicit Entries': {
      src: `- [ YAML : separate ]
- [ : empty key entry ]
- [ {JSON: like}:adjacent ]`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: { items: ['[', 'YAML', ':', 'separate', ']'] }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: { items: ['[', ':', 'empty key entry', ']'] }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      '[',
                      { items: ['{', 'JSON', ':', 'like', '}'] },
                      ':',
                      'adjacent',
                      ']'
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 7.22. Invalid Implicit Keys': {
      src: `[ foo
 bar: invalid,
 "foo...>1K characters...bar": invalid ]`,
      tgt: [
        {
          contents: [
            {
              items: [
                '[',
                'foo bar',
                ':',
                'invalid',
                ',',
                'foo...>1K characters...bar',
                ':',
                'invalid',
                ']'
              ]
            }
          ]
        }
      ]
      // ERROR: The foo bar key spans multiple lines
      // ERROR: The foo...bar key is too long
    }
  },

  '7.5. Flow Nodes': {
    'Example 7.23. Flow Content': {
      src: `- [ a, b ]
- { a: b }
- "a"
- 'b'
- c`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: { items: ['[', 'a', ',', 'b', ']'] }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: { items: ['{', 'a', ':', 'b', '}'] }
                },
                { type: Type.SEQ_ITEM, node: 'a' },
                { type: Type.SEQ_ITEM, node: 'b' },
                { type: Type.SEQ_ITEM, node: 'c' }
              ]
            }
          ]
        }
      ]
    },

    'Example 7.24. Flow Nodes': {
      src: `- !!str "a"
- 'b'
- &anchor "c"
- *anchor
- !!str`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: { tag: { handle: '!!', suffix: 'str' }, strValue: 'a' }
                },
                { type: Type.SEQ_ITEM, node: 'b' },
                {
                  type: Type.SEQ_ITEM,
                  node: { anchor: 'anchor', strValue: 'c' }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: { type: Type.ALIAS, rawValue: 'anchor' }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: { tag: { handle: '!!', suffix: 'str' } }
                }
              ]
            }
          ]
        }
      ]
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
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: { comment: ' Empty header', strValue: 'literal\n' }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    comment: ' Indentation indicator',
                    strValue: ' folded\n'
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: { comment: ' Chomping indicator', strValue: 'keep\n\n' }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: { comment: ' Both indicators', strValue: ' strip' }
                }
              ]
            }
          ]
        }
      ]
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
      tgt: [
        {
          contents: [
            {
              items: [
                { type: Type.SEQ_ITEM, node: 'detected\n' },
                { type: Type.SEQ_ITEM, node: '\n\n# detected\n' },
                { type: Type.SEQ_ITEM, node: ' explicit\n' },
                { type: Type.SEQ_ITEM, node: '\t\ndetected\n' }
              ]
            }
          ]
        }
      ]
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
        {
          contents: [{ items: [{ node: '' }] }, { type: 'BLANK_LINE' }, 'text']
        },
        {
          contents: [{ items: [{ node: 'text\n' }] }, 'text']
        },
        {
          contents: [{ items: [{ node: '' }] }, 'text']
        }
      ]
      // ERROR: A leading all-space line must not have too many spaces.
      // ERROR: A following text line must not be less indented.
      // ERROR: The text is less indented than the indicated level.
    },

    'Example 8.4. Chomping Final Line Break': {
      src: `strip: |-
  text
clip: |
  text
keep: |+
  text\n`,
      tgt: [
        {
          contents: [
            {
              items: [
                'strip',
                { type: Type.MAP_VALUE, node: 'text' },
                'clip',
                { type: Type.MAP_VALUE, node: 'text\n' },
                'keep',
                { type: Type.MAP_VALUE, node: 'text\n' }
              ]
            }
          ]
        }
      ]
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
      tgt: [
        {
          contents: [
            { type: Type.BLANK_LINE },
            { comment: ' Strip' },
            { comment: ' Comments:' },
            {
              items: [
                'strip',
                { type: Type.MAP_VALUE, node: '# text' },
                { type: Type.BLANK_LINE },
                { comment: ' Clip' },
                { comment: ' comments:' },
                { type: Type.BLANK_LINE },
                'clip',
                { type: Type.MAP_VALUE, node: '# text\n' },
                { type: Type.BLANK_LINE },
                { comment: ' Keep' },
                { comment: ' comments:' },
                { type: Type.BLANK_LINE },
                'keep',
                { type: Type.MAP_VALUE, node: '# text\n\n' }
              ]
            },
            { comment: ' Trail' },
            { comment: ' comments.' }
          ]
        }
      ]
    },

    'Example 8.6. Empty Scalar Chomping': {
      src: `strip: >-

clip: >

keep: |+\n\n`,
      tgt: [
        {
          contents: [
            {
              items: [
                'strip',
                { type: Type.MAP_VALUE, node: '' },
                { type: Type.BLANK_LINE },
                'clip',
                { type: Type.MAP_VALUE, node: '' },
                { type: Type.BLANK_LINE },
                'keep',
                { type: Type.MAP_VALUE, node: '\n' }
              ]
            }
          ]
        }
      ]
    }
  },

  '8.1.2. Literal Style': {
    'Example 8.7. Literal Scalar': {
      src: `|
 literal
 \ttext\n\n`,
      tgt: [{ contents: ['literal\n\ttext\n'] }]
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
      tgt: [
        {
          contents: ['\n\nliteral\n \n\ntext\n', { comment: ' Comment' }]
        }
      ]
    }
  },

  '8.1.3. Folded Style': {
    'Example 8.9. Folded Scalar': {
      src: `>
 folded
 text\n\n`,
      tgt: [{ contents: ['folded text\n'] }]
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
        {
          contents: [
            '\nfolded line\nnext line\n  * bullet\n\n  * list\n  * lines\n\nlast line\n',
            { comment: ' Comment' }
          ]
        }
      ]
    }
  },

  '8.2.1. Block Sequences': {
    'Example 8.14. Block Sequence': {
      src: `block sequence:
  - one
  - two : three\n`,
      tgt: [
        {
          contents: [
            {
              items: [
                'block sequence',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      { type: Type.SEQ_ITEM, node: 'one' },
                      {
                        type: Type.SEQ_ITEM,
                        node: {
                          items: [
                            'two',
                            { type: Type.MAP_VALUE, node: 'three' }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 8.15. Block Sequence Entry Types': {
      src: `- # Empty
- |
 block node
- - one # Compact
  - two # sequence
- one: two # Compact mapping`,
      tgt: [
        {
          contents: [
            {
              items: [
                { type: Type.SEQ_ITEM, node: null, comment: ' Empty' },
                { type: Type.SEQ_ITEM, node: 'block node\n' },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      {
                        type: Type.SEQ_ITEM,
                        node: { comment: ' Compact', strValue: 'one' }
                      },
                      {
                        type: Type.SEQ_ITEM,
                        node: { comment: ' sequence', strValue: 'two' }
                      }
                    ]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      'one',
                      {
                        type: Type.MAP_VALUE,
                        node: { comment: ' Compact mapping', strValue: 'two' }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },

  '8.2.2. Block Mappings': {
    'Example 8.16. Block Mappings': {
      src: `block mapping:
 key: value\n`,
      tgt: [
        {
          contents: [
            {
              items: [
                'block mapping',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: ['key', { type: Type.MAP_VALUE, node: 'value' }]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 8.17. Explicit Block Mapping Entries': {
      src: `? explicit key # Empty value
? |
  block key
: - one # Explicit compact
  - two # block value\n`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.MAP_KEY,
                  node: { comment: ' Empty value', strValue: 'explicit key' }
                },
                { type: Type.MAP_KEY, node: 'block key\n' },
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [
                      {
                        type: Type.SEQ_ITEM,
                        node: { comment: ' Explicit compact', strValue: 'one' }
                      },
                      {
                        type: Type.SEQ_ITEM,
                        node: { comment: ' block value', strValue: 'two' }
                      }
                    ]
                  }
                }
              ]
            }
          ]
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
          contents: [
            {
              items: [
                'plain key',
                { type: Type.MAP_VALUE, node: 'in-line value' },
                { type: Type.MAP_VALUE, node: null, comment: ' Both empty' },
                'quoted key',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    items: [{ type: Type.SEQ_ITEM, node: 'entry' }]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 8.19. Compact Block Mappings': {
      src: `- sun: yellow
- ? earth: blue
  : moon: white\n`,
      tgt: [
        {
          contents: [
            {
              items: [
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: ['sun', { type: Type.MAP_VALUE, node: 'yellow' }]
                  }
                },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    items: [
                      {
                        type: Type.MAP_KEY,
                        node: {
                          items: [
                            'earth',
                            { type: Type.MAP_VALUE, node: 'blue' }
                          ]
                        }
                      },
                      {
                        type: Type.MAP_VALUE,
                        node: {
                          items: [
                            'moon',
                            { type: Type.MAP_VALUE, node: 'white' }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
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
      tgt: [
        {
          contents: [
            {
              items: [
                { type: Type.SEQ_ITEM, node: 'flow in block' },
                { type: Type.SEQ_ITEM, node: 'Block scalar\n' },
                {
                  type: Type.SEQ_ITEM,
                  node: {
                    tag: { handle: '!!', suffix: 'map' },
                    comment: ' Block collection',
                    items: ['foo', { type: Type.MAP_VALUE, node: 'bar' }]
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    'Example 8.21. Block Scalar Nodes': {
      src: `literal: |2
  value
folded:
   !foo
  >1
 value`,
      tgt: [
        {
          contents: [
            {
              items: [
                'literal',
                { type: Type.MAP_VALUE, node: 'value\n' },
                'folded',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    tag: { handle: '!', suffix: 'foo' },
                    strValue: 'value\n'
                  }
                } // trailing \n against spec
              ]
            }
          ]
        }
      ]
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
          contents: [
            {
              items: [
                'sequence',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    tag: { handle: '!!', suffix: 'seq' },
                    items: [
                      { type: Type.SEQ_ITEM, node: 'entry' },
                      {
                        type: Type.SEQ_ITEM,
                        node: {
                          tag: { handle: '!!', suffix: 'seq' },
                          items: [{ type: Type.SEQ_ITEM, node: 'nested' }]
                        }
                      }
                    ]
                  }
                },
                'mapping',
                {
                  type: Type.MAP_VALUE,
                  node: {
                    tag: { handle: '!!', suffix: 'map' },
                    items: ['foo', { type: Type.MAP_VALUE, node: 'bar' }]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },

  '9.1. Documents': {
    'Example 9.1. Document Prefix': {
      src: `\u{FEFF}# Comment
# lines
Document`,
      tgt: [
        {
          contents: [{ comment: ' Comment' }, { comment: ' lines' }, 'Document']
        }
      ]
    },

    'Example 9.2. Document Markers': {
      src: `%YAML 1.2
---
Document
... # Suffix`,
      tgt: [
        {
          directives: [{ name: 'YAML', parameters: ['1.2'] }],
          contents: ['Document', { comment: ' Suffix' }]
        }
      ]
    },

    'Example 9.3. Bare Documents': {
      src: `Bare
document
...
# No document
...
|
%!PS-Adobe-2.0 # Not the first line`,
      tgt: [
        {
          contents: ['Bare document']
        },
        {
          contents: [{ comment: ' No document' }]
        },
        {
          contents: ['%!PS-Adobe-2.0 # Not the first line\n']
        }
      ]
    },

    'Example 9.4. Explicit Documents': {
      src: `---
{ matches
% : 20 }
...
---
# Empty
...`,
      tgt: [
        {
          contents: [{ items: ['{', 'matches %', ':', '20', '}'] }]
        },
        {
          contents: [{ comment: ' Empty' }]
        }
      ]
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
      tgt: [
        {
          directives: [{ name: 'YAML', parameters: ['1.2'] }],
          contents: ['%!PS-Adobe-2.0\n']
        },
        {
          directives: [{ name: 'YAML', parameters: ['1.2'] }],
          contents: [{ comment: ' Empty' }]
        }
      ]
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
      tgt: [
        {
          contents: ['Document']
        },
        {
          contents: [{ comment: ' Empty' }]
        },
        {
          directives: [{ name: 'YAML', parameters: ['1.2'] }],
          contents: [
            { items: ['matches %', { type: Type.MAP_VALUE, node: '20' }] }
          ]
        }
      ]
    }
  },

  'yaml-test-suite': {
    '2EBW: Allowed characters in keys': {
      src: `a!"#$%&'()*+,-./09:;<=>?@AZ[\\]^_\`az{|}~: safe
?foo: safe question mark
:foo: safe colon
-foo: safe dash
this is#not: a comment`,
      tgt: [
        {
          contents: [
            {
              items: [
                'a!"#$%&\'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~',
                { node: 'safe' },
                '?foo',
                { node: 'safe question mark' },
                ':foo',
                { node: 'safe colon' },
                '-foo',
                { node: 'safe dash' },
                'this is#not',
                { node: 'a comment' }
              ]
            }
          ]
        }
      ]
    },

    'PW8X: Anchors on Empty Scalars': {
      src: `- &a
- a
-
  &a : a
  b: &b
  &c : &a
-
  ? &d
  ? &e
  : &a`,
      tgt: [
        {
          contents: [
            {
              items: [
                { node: { anchor: 'a' } },
                { node: 'a' },
                {
                  node: {
                    items: [
                      { anchor: 'a' },
                      { type: Type.MAP_VALUE, node: 'a' },
                      'b',
                      { type: Type.MAP_VALUE, node: { anchor: 'b' } },
                      { anchor: 'c' },
                      { type: Type.MAP_VALUE, node: { anchor: 'a' } }
                    ]
                  }
                },
                {
                  node: {
                    items: [
                      { type: Type.MAP_KEY, node: { anchor: 'd' } },
                      { type: Type.MAP_KEY, node: { anchor: 'e' } },
                      { type: Type.MAP_VALUE, node: { anchor: 'a' } }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  }
}

for (const section in spec) {
  describe(section, () => {
    for (const name in spec[section]) {
      test(name, () => {
        const { src, tgt } = spec[section][name]
        const documents = parse(src)
        trace: 'PARSED', JSON.stringify(pretty(documents), null, '  ')
        testSpec(documents, tgt)
        const reSrc = String(documents)
        trace: 'RE-STRUNG', '\n' + reSrc
        // expect(reSrc).toBe(src)
        const reDoc = parse(reSrc)
        trace: 'RE-PARSED', JSON.stringify(pretty(reDoc), null, '  ')
        testSpec(reDoc, tgt)
      })
    }
  })
}
