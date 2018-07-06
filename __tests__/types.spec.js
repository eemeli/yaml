import YAML from '../src/index'
import Scalar from '../src/schema/Scalar'
import Seq from '../src/schema/Seq'
import { strOptions } from '../src/schema/_string'

let origFoldOptions

beforeAll(() => {
  origFoldOptions = strOptions.fold
  strOptions.fold = {
    lineWidth: 20,
    minContentWidth: 0
  }
})

afterAll(() => {
  strOptions.fold = origFoldOptions
})

describe('json schema', () => {
  test('!!bool', () => {
    const src = `"canonical": true
"answer": false
"logical": True
"option": TruE`

    const doc = YAML.parseDocuments(src, { schema: 'json' })[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: true,
      answer: false,
      logical: null,
      option: null
    })
    expect(doc.errors).toHaveLength(2)
  })

  test('!!float', () => {
    const src = `"canonical": 6.8523015e+5
"fixed": 685230.15
"negative infinity": -.inf
"not a number": .NaN`

    const doc = YAML.parseDocuments(src, { schema: 'json' })[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: 685230.15,
      fixed: 685230.15,
      'negative infinity': null,
      'not a number': null
    })
    expect(doc.errors).toHaveLength(2)
  })

  test('!!int', () => {
    const src = `"canonical": 685230
"decimal": -685230
"octal": 0o2472256
"hexadecimal": 0x0A74AE`

    const doc = YAML.parseDocuments(src, { schema: 'json' })[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: 685230,
      decimal: -685230,
      octal: null,
      hexadecimal: null
    })
    expect(doc.errors).toHaveLength(2)
  })

  test('!!null', () => {
    const src = `"empty":
"canonical": ~
"english": null
~: 'null key'`

    const doc = YAML.parseDocuments(src, { schema: 'json' })[0]
    expect(doc.toJSON()).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
    expect(doc.errors).toHaveLength(2)
  })
})

describe('core schema', () => {
  test('!!bool', () => {
    const src = `canonical: true
answer: FALSE
logical: True
option: TruE\n`

    const doc = YAML.parseDocuments(src)[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: true,
      answer: false,
      logical: true,
      option: true
    })
    expect(String(doc)).toBe(src.toLowerCase())
  })

  test('!!float', () => {
    const src = `canonical: 6.8523015e+5
fixed: 685230.15
negative infinity: -.inf
not a number: .NaN`

    const doc = YAML.parseDocuments(src)[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: 685230.15,
      fixed: 685230.15,
      'negative infinity': Number.NEGATIVE_INFINITY,
      'not a number': NaN
    })
    expect(String(doc)).toBe(`canonical: 685230.15
fixed: 685230.15
negative infinity: -.inf
not a number: .nan\n`)
  })

  test('!!int', () => {
    const src = `canonical: 685230
decimal: +685230
octal: 0o2472256
hexadecimal: 0x0A74AE`

    const doc = YAML.parseDocuments(src)[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: 685230,
      decimal: 685230,
      octal: 685230,
      hexadecimal: 685230
    })
    expect(String(doc)).toBe(`canonical: 685230
decimal: 685230
octal: 0o2472256
hexadecimal: 0xa74ae\n`)
  })

  test('!!null', () => {
    const src = `empty:
canonical: ~
english: null
~: null key`

    const doc = YAML.parseDocuments(src)[0]
    expect(doc.toJSON()).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
    expect(String(doc)).toBe(`empty: null
canonical: null
english: null
null: null key\n`)
  })
})

describe('YAML 1.1 schema', () => {
  test('!!binary', () => {
    const src = `canonical: !!binary "\\
 R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5\\
 OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+\\
 +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC\\
 AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs="
generic: !!binary |
 R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5
 OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+
 +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC
 AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs=
description:
 The binary value above is a tiny arrow encoded as a gif image.`

    const doc = YAML.parseDocuments(src, { schema: 'yaml-1.1' })[0]
    const canonical = doc.contents.items[0].value.value
    const generic = doc.contents.items[1].value.value
    expect(canonical).toBeInstanceOf(Uint8Array)
    expect(generic).toBeInstanceOf(Uint8Array)
    expect(canonical).toHaveLength(185)
    expect(generic).toHaveLength(185)
    let canonicalStr = ''
    let genericStr = ''
    for (let i = 0; i < canonical.length; ++i)
      canonicalStr += String.fromCharCode(canonical[i])
    for (let i = 0; i < generic.length; ++i)
      genericStr += String.fromCharCode(generic[i])
    expect(canonicalStr).toBe(genericStr)
    expect(canonicalStr.substr(0, 5)).toBe('GIF89')
  })

  test('!!bool', () => {
    const src = `
canonical: y
answer: NO
logical: True
option: on`

    const doc = YAML.parseDocuments(src, { version: '1.1' })[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: true,
      answer: false,
      logical: true,
      option: true
    })
    expect(String(doc)).toBe(`canonical: true
answer: false
logical: true
option: true\n`)
  })

  test('!!float', () => {
    const src = `%YAML 1.1
---
canonical: 6.8523015e+5
exponential: 685.230_15e+03
fixed: 685_230.15
sexagesimal: 190:20:30.15
negative infinity: -.inf
not a number: .NaN`

    const doc = YAML.parseDocuments(src)[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: 685230.15,
      exponential: 685230.15,
      fixed: 685230.15,
      sexagesimal: 685230.15,
      'negative infinity': Number.NEGATIVE_INFINITY,
      'not a number': NaN
    })
    expect(String(doc)).toBe(`%YAML 1.1
---
canonical: 685230.15
exponential: 685230.15
fixed: 685230.15
sexagesimal: 190:20:30.15
negative infinity: -.inf
not a number: .nan\n`)
  })

  test('!!int', () => {
    const src = `%YAML 1.1
---
canonical: 685230
decimal: +685_230
octal: 02472256
hexadecimal: 0x_0A_74_AE
binary: 0b1010_0111_0100_1010_1110
sexagesimal: 190:20:30`

    const doc = YAML.parseDocuments(src)[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: 685230,
      decimal: 685230,
      octal: 685230,
      hexadecimal: 685230,
      binary: 685230,
      sexagesimal: 685230
    })
    expect(String(doc)).toBe(`%YAML 1.1
---
canonical: 685230
decimal: 685230
octal: 02472256
hexadecimal: 0xa74ae
binary: 0b10100111010010101110
sexagesimal: 190:20:30\n`)
  })

  test('!!null', () => {
    const src = `%YAML 1.1
---
empty:
canonical: ~
english: null
~: null key`

    const doc = YAML.parseDocuments(src)[0]
    expect(doc.toJSON()).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
    expect(String(doc)).toBe(`%YAML 1.1
---
empty: null
canonical: null
english: null
null: null key\n`)
  })

  test('!!timestamp', () => {
    const src = `%YAML 1.1
---
canonical:        2001-12-15T02:59:43.1Z
valid iso8601:    2001-12-14t21:59:43.10-05:00
space separated:  2001-12-14 21:59:43.10 -5
no time zone (Z): 2001-12-15 2:59:43.10
date (00:00:00Z): 2002-12-14`

    const doc = YAML.parseDocuments(src)[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: '2001-12-15T02:59:43.100Z',
      'valid iso8601': '2001-12-15T02:59:43.100Z',
      'space separated': '2001-12-15T02:59:43.100Z',
      'no time zone (Z)': '2001-12-15T02:59:43.100Z',
      'date (00:00:00Z)': '2002-12-14T00:00:00.000Z'
    })
    expect(String(doc)).toBe(`%YAML 1.1
---
canonical: 2001-12-15T02:59:43.100Z
valid iso8601: 2001-12-15T02:59:43.100Z
space separated: 2001-12-15T02:59:43.100Z
no time zone (Z): 2001-12-15T02:59:43.100Z
date (00:00:00Z): 2002-12-14T00:00:00.000Z\n`)
  })
})

describe('custom tags', () => {
  const src = `%TAG !e! tag:example.com,2000:test/
---
!e!x
- !y 2
- !e!z 3
- !<tag:example.com,2000:other/w> 4
- '5'`

  test('parse', () => {
    const doc = YAML.parseDocuments(src)[0]
    expect(doc.contents).toBeInstanceOf(Seq)
    expect(doc.contents.tag).toBe('tag:example.com,2000:test/x')
    const { items } = doc.contents
    expect(items).toHaveLength(4)
    items.forEach(item => expect(typeof item.value).toBe('string'))
    expect(items[0].tag).toBe('!y')
    expect(items[1].tag).toBe('tag:example.com,2000:test/z')
    expect(items[2].tag).toBe('tag:example.com,2000:other/w')
  })

  test('stringify', () => {
    const doc = YAML.parseDocuments(src)[0]
    expect(String(doc)).toBe(
      `%TAG !e! tag:example.com,2000:test/
---
!e!x
- !y "2"
- !e!z "3"
- !<tag:example.com,2000:other/w> "4"
- '5'\n`
    )
  })

  test('modify', () => {
    const doc = YAML.parseDocuments(src)[0]
    doc.setTagPrefix('!f!', 'tag:example.com,2000:other/')
    doc.contents.commentBefore = 'c'
    doc.contents.items[3].comment = 'cc'
    const s = new Scalar(6)
    s.tag = '!g'
    doc.contents.items.splice(1, 1, s, '7')
    expect(String(doc)).toBe(
      `%TAG !e! tag:example.com,2000:test/
%TAG !f! tag:example.com,2000:other/
---
#c
!e!x
- !y "2"
- !g 6
- "7"
- !f!w "4"
- '5' #cc\n`
    )
  })

  test('YAML 1.0 explicit tags', () => {
    const src = `%YAML:1.0
---
date: 2001-01-23
number: !int '123'
string: !str 123
pool: !!ball { number: 8 }
perl: !perl/Text::Tabs {}`

    const doc = YAML.parseDocuments(src)[0]
    expect(doc.version).toBe('1.0')
    expect(doc.toJSON()).toMatchObject({
      date: '2001-01-23T00:00:00.000Z',
      number: 123,
      string: '123',
      pool: { number: 8 },
      perl: {}
    })
    expect(String(doc)).toBe(`%YAML:1.0
---
date: 2001-01-23T00:00:00.000Z
number: 123
string: \"123\"
pool:
  !ball { number: 8 }
perl:
  !perl/Text::Tabs {}\n`)
  })

  test('YAML 1.0 tag prefixing', () => {
    const src = `%YAML:1.0
---
invoice: !domain.tld,2002/^invoice
  customers: !seq
    - !^customer
      given : Chris
      family : Dumars`

    const doc = YAML.parseDocuments(src)[0]
    expect(doc.version).toBe('1.0')
    expect(doc.toJSON()).toMatchObject({
      invoice: { customers: [{ family: 'Dumars', given: 'Chris' }] }
    })
    expect(String(doc)).toBe(`%YAML:1.0
---
invoice:
  !domain.tld,2002/^invoice
  customers:
    - !^customer
      given: Chris
      family: Dumars\n`)
  })
})
