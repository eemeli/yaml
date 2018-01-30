import { Type } from 'raw-yaml'
import resolve from '../src/index'

const spec = {
  '2.1. Collections': {
    'Example 2.1. Sequence of Scalars': {
      src:
`- Mark McGwire\r
- Sammy Sosa\r
- Ken Griffey\r`,
      tgt: [ [ 'Mark McGwire', 'Sammy Sosa', 'Ken Griffey' ] ]
    },

    'Example 2.2. Mapping Scalars to Scalars': {
      src:
`hr:  65    # Home runs\r
avg: 0.278 # Batting average\r
rbi: 147   # Runs Batted In`,
      tgt: [ {
        hr: 65, // ' Home runs'
        avg: 0.278, // ' Batting average'
        rbi: 147 // ' Runs Batted In'
      } ]
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
      tgt: [ {
        american: [
          'Boston Red Sox',
          'Detroit Tigers',
          'New York Yankees'
        ],
        national: [
          'New York Mets',
          'Chicago Cubs',
          'Atlanta Braves',
        ]
      } ]
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
      tgt: [ [
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
      ] ]
    },

    'Example 2.5. Sequence of Sequences': {
      src:
`- [name        , hr, avg  ]
- [Mark McGwire, 65, 0.278]
- [Sammy Sosa  , 63, 0.288]`,
      tgt: [ [
        ['name', 'hr', 'avg'],
        ['Mark McGwire', 65, 0.278],
        ['Sammy Sosa', 63, 0.288]
      ] ]
    },

    'Example 2.6. Mapping of Mappings': {
      src:
`Mark McGwire: {hr: 65, avg: 0.278}
Sammy Sosa: {
    hr: 63,
    avg: 0.288
  }`,
      tgt: [ {
        'Mark McGwire': { hr: 65, avg: 0.278 },
        'Sammy Sosa': { hr: 63, avg: 0.288 }
      } ]
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
        // ' Ranking of 1998 home runs'
        [ 'Mark McGwire', 'Sammy Sosa', 'Ken Griffey' ],
        // ' Team ranking'
        [ 'Chicago Cubs', 'St Louis Cardinals' ]
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
      src:
`---
hr: # 1998 hr ranking
  - Mark McGwire
  - Sammy Sosa
rbi:
  # 1998 rbi ranking
  - Sammy Sosa
  - Ken Griffey`,
      tgt: [ {
        hr: [ // ' 1998 hr ranking'
          'Mark McGwire',
          'Sammy Sosa'
        ],
        rbi: [ // ' 1998 rbi ranking'
          'Sammy Sosa',
          'Ken Griffey'
        ]
      } ]
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
      tgt: [ {
        hr: [ 'Mark McGwire', /* Following node labeled SS */ 'Sammy Sosa' ],
        rbi: [ 'Sammy Sosa' /* Subsequent occurrence */, 'Ken Griffey' ]
      } ]
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
      tgt: [ {
        '["Detroit Tigers","Chicago cubs"]': [ '2001-07-23' ],
        '["New York Yankees","Atlanta Braves"]': [ '2001-07-02', '2001-08-12', '2001-08-14' ]
      } ]
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
      tgt: [ [
        // Products purchased
        { item: 'Super Hoop', quantity: 1 },
        { item: 'Basketball', quantity: 4 },
        { item: 'Big Shoes', quantity: 1 }
      ] ]
    },
  },

  '2.3. Scalars': {
    'Example 2.13. In literals, newlines are preserved': {
      src:
`# ASCII Art
--- |
  \\//||\\/||
  // ||  ||__`,
      tgt: [
        '\\//||\\/||\n' +
         '// ||  ||__\n' ]
    },

    'Example 2.14. In the folded scalars, newlines become spaces': {
      src:
`--- >
  Mark McGwire's
  year was crippled
  by a knee injury.`,
      tgt: [ 'Mark McGwire\'s year was crippled by a knee injury.\n' ]
    },

    'Example 2.15. Folded newlines are preserved for "more indented" and blank lines': {
      src:
`>
 Sammy Sosa completed another
 fine season with great stats.

   63 Home Runs
   0.288 Batting Average

 What a year!`,
      tgt: [
`Sammy Sosa completed another fine season with great stats.

  63 Home Runs
  0.288 Batting Average

What a year!\n` ]
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
      tgt: [ {
        name: 'Mark McGwire',
        accomplishment: 'Mark set a major league home run record in 1998.\n',
        stats: '65 Home Runs\n0.278 Batting Average\n' } ]
    },

    'Example 2.17. Quoted Scalars': {
      src:
`unicode: "Sosa did fine.\\u263A"
control: "\\b1998\\t1999\\t2000\\n"
hex esc: "\\x0d\\x0a is \\r\\n"

single: '"Howdy!" he cried.'
quoted: ' # Not a ''comment''.'
tie-fighter: '|\\-*-/|'`,
      tgt: [ {
        unicode: 'Sosa did fine.☺',
        control: '\b1998\t1999\t2000\n',
        'hex esc': '\r\n is \r\n',
        single: '"Howdy!" he cried.',
        quoted: " # Not a 'comment'.",
        'tie-fighter': '|\\-*-/|' } ]
    },

    'Example 2.18. Multi-line Flow Scalars': {
      src:
`plain:
  This unquoted scalar
  spans many lines.

quoted: "So does this
  quoted scalar.\n"`,
      tgt: [ {
        plain: 'This unquoted scalar spans many lines.',
        quoted: 'So does this quoted scalar. ' } ]
    },
  },

  '2.4. Tags': {
    'Example 2.19. Integers': {
      src:
`canonical: 12345
decimal: +12345
octal: 0o14
hexadecimal: 0xC`,
      tgt: [ {
        canonical: 12345,
        decimal: 12345,
        octal: 12,
        hexadecimal: 12 } ]
    },

    'Example 2.20. Floating Point': {
      src:
`canonical: 1.23015e+3
exponential: 12.3015e+02
fixed: 1230.15
negative infinity: -.inf
not a number: .NaN`,
      tgt: [ {
        canonical: 1230.15,
        exponential: 1230.15,
        fixed: 1230.15,
        'negative infinity': -Infinity,
        'not a number': NaN } ]
    },

    'Example 2.21. Miscellaneous': {
      src:
`null:
booleans: [ true, false ]
string: '012345'`,
      tgt: [ {
        null: null,
        booleans: [ true, false ],
        string: '012345' } ]
    },

    'Example 2.22. Timestamps': {
      src:
`canonical: 2001-12-15T02:59:43.1Z
iso8601: 2001-12-14t21:59:43.10-05:00
spaced: 2001-12-14 21:59:43.10 -5
date: 2002-12-14`,
      tgt: [ {
        canonical: '2001-12-15T02:59:43.1Z',
        iso8601: '2001-12-14t21:59:43.10-05:00',
        spaced: '2001-12-14 21:59:43.10 -5',
        date: '2002-12-14' } ],
      special: (src) => {
        const doc = resolve(src, { extended: true })[0]
        const { canonical, iso8601, spaced, date } = doc.toJSON()
        expect(canonical).toBe(new Date('2001-12-15T02:59:43.1Z').toJSON())
        expect(iso8601).toBe(new Date('2001-12-14t21:59:43.10-05:00').toJSON())
        expect(spaced).toBe(new Date('2001-12-14 21:59:43.10 -5').toJSON())
        expect(date).toBe(new Date('2002-12-14').toJSON())
      }
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
      tgt: [ {
        'not-date': '2002-04-28',
        picture: null,
        'application specific tag': null
      } ],
      errors: [ [
        'The tag tag:yaml.org,2002:binary is unavailable',
        'The tag !something is unavailable'
      ] ],
      special: (src) => {
        const doc = resolve(src, { extended: true })[0]
        const data = doc.contents.items[1].value
        expect(data).toBeInstanceOf(Uint8Array)
        expect(data.byteLength).toBe(65)
      }
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
      tgt: [ [
        { center: { x: 73, y: 129 }, radius: 7 },
        { start: { x: 73, y: 129 }, finish: { x: 89, y: 102 } },
        { start: { x: 73, y: 129 },
          color: 16772795,
          text: 'Pretty vector drawing.' } ] ],
      errors: [ [
        'The tag tag:clarkevans.com,2002:shape is unavailable, falling back to tag:yaml.org,2002:seq',
        'The tag tag:clarkevans.com,2002:circle is unavailable, falling back to tag:yaml.org,2002:map',
        'The tag tag:clarkevans.com,2002:line is unavailable, falling back to tag:yaml.org,2002:map',
        'The tag tag:clarkevans.com,2002:label is unavailable, falling back to tag:yaml.org,2002:map'
      ] ]
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
        'Mark McGwire': null,
        'Sammy Sosa': null,
        'Ken Griff': null
      } ],
      errors: [ [
        'The tag tag:yaml.org,2002:set is unavailable, falling back to tag:yaml.org,2002:map'
      ] ]
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
      tgt: [ [
        { 'Mark McGwire': 65 },
        { 'Sammy Sosa': 63 },
        { 'Ken Griffy': 58 } ] ],
      errors: [ [
        'The tag tag:yaml.org,2002:omap is unavailable, falling back to tag:yaml.org,2002:seq'
      ] ]
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
      tgt: [ {
        invoice: 34843,
        date: '2001-01-23',
        'bill-to':
         { given: 'Chris',
           family: 'Dumars',
           address:
            { lines: '458 Walkman Dr.\nSuite #292\n',
              city: 'Royal Oak',
              state: 'MI',
              postal: 48046 } },
        'ship-to':
         { given: 'Chris',
           family: 'Dumars',
           address:
            { lines: '458 Walkman Dr.\nSuite #292\n',
              city: 'Royal Oak',
              state: 'MI',
              postal: 48046 } },
        product:
         [ { sku: 'BL394D',
             quantity: 4,
             description: 'Basketball',
             price: 450 },
           { sku: 'BL4438H',
             quantity: 1,
             description: 'Super Hoop',
             price: 2392 } ],
        tax: 251.42,
        total: 4443.52,
        comments: 'Late afternoon is best. Backup contact is Nancy Billsmer @ 338-4338.' } ],
      errors: [ [
        'The tag tag:clarkevans.com,2002:invoice is unavailable, falling back to tag:yaml.org,2002:map'
      ] ]
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
      tgt: [ { Time: '2001-11-23 15:01:42 -5',
      User: 'ed',
      Warning: 'This is an error message for the log file' },
    { Time: '2001-11-23 15:02:31 -5',
      User: 'ed',
      Warning: 'A slightly different error message.' },
    { Date: '2001-11-23 15:03:17 -5',
      User: 'ed',
      Fatal: 'Unknown variable "bar"',
      Stack:
       [ { file: 'TopClass.py',
           line: 23,
           code: 'x = MoreObject("345\\n")\n' },
         { file: 'MoreClass.py', line: 58, code: 'foo = bar' } ] } ]
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
      tgt: [ {
        sequence: [ 'one', 'two' ],
        mapping: { sky: 'blue', sea: 'green' } } ]
    },

    'Example 5.4. Flow Collection Indicators': {
      src:
`sequence: [ one, two, ]
mapping: { sky: blue, sea: green }`,
      tgt: [ {
        sequence: [ 'one', 'two' ],
        mapping: { sky: 'blue', sea: 'green' } } ]
    },

    'Example 5.5. Comment Indicator': {
      src:
`# Comment only.`,
      tgt: [ null ]
    },

    'Example 5.6. Node Property Indicators': {
      src:
`anchored: !local &anchor value
alias: *anchor`,
      tgt: [ { anchored: null, alias: null } ],
      errors: [ [ 'The tag !local is unavailable' ] ],
      special: (src) => {
        log: 'FIXME'
      }
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
      tgt: [ {
        literal: 'some\ntext\n',
        folded: 'some text\n' } ]
    },

    'Example 5.8. Quoted Scalar Indicators': {
      src:
`single: 'text'
double: "text"`,
      tgt: [ { single: 'text', double: 'text' } ]
    },

    'Example 5.9. Directive Indicator': {
      src:
`%YAML 1.2
--- text`,
      tgt: [ 'text' ],
      special: (src) => {
        const doc = resolve(src)[0]
        expect(doc.version).toBe('1.2')
      }
    },

    'Example 5.10. Invalid use of Reserved Indicators': {
      src:
`commercial-at: @text
grave-accent: \`text`,
      tgt: [ { 'commercial-at': '@text', 'grave-accent': '`text' } ]
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
      tgt: [ {
        quoted: 'Quoted \t',
        block: 'void main() {\n\tprintf("Hello, world!\\n");\n}\n' } ]
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
      tgt: ['Fun with \x5C \x22 \x07 \x08 \x1B \x0C \x0A \x0D \x09 \x0B \x00 \x20 \xA0 \x85 \u2028 \u2029 A A A']
    },

    'Example 5.14. Invalid Escaped Characters': {
      src:
`Bad escapes:
  "\\c
  \\xq-"`,
      tgt: [ { 'Bad escapes': null } ],
      // ERROR: c is an invalid escaped character.
      // ERROR: q and - are invalid hex digits.
      errors: [ [
        'Invalid escape sequence \\c'
      ] ]
    },
  }
}

for (const section in spec) {
  describe(section, () => {
    for (const name in spec[section]) {
      test(name, () => {
        const { src, tgt, errors, special } = spec[section][name]
        const documents = resolve(src)
        const json = documents.map(doc => doc.toJSON())
        trace: name, console.dir(json, { depth: null }) || ''
        expect(json).toMatchObject(tgt)
        documents.forEach((doc, i) => {
          if (!errors || !errors[i]) expect(doc.errors).toHaveLength(0)
          else errors[i].forEach((err, j) => expect(doc.errors[j].message).toBe(err))
        })
        if (special) special(src)
      })
    }
  })
}
