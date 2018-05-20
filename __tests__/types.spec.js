import YAML from '../src/index'
import Scalar from '../src/schema/Scalar'
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
    const src =
`"canonical": true
"answer": false
"logical": True
"option": TruE`

    const doc = YAML.parseStream(src, { schema: 'json' })[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: true,
      answer: false,
      logical: null,
      option: null
    })
    expect(doc.errors).toHaveLength(2)
  })

  test('!!float', () => {
    const src =
`"canonical": 6.8523015e+5
"fixed": 685230.15
"negative infinity": -.inf
"not a number": .NaN`

    const doc = YAML.parseStream(src, { schema: 'json' })[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: 685230.15,
      fixed: 685230.15,
      'negative infinity': null,
      'not a number': null
    })
    expect(doc.errors).toHaveLength(2)
  })

  test('!!int', () => {
    const src =
`"canonical": 685230
"decimal": -685230
"octal": 0o2472256
"hexadecimal": 0x0A74AE`

    const doc = YAML.parseStream(src, { schema: 'json' })[0]
    expect(doc.toJSON()).toMatchObject({
      canonical: 685230,
      decimal: -685230,
      octal: null,
      hexadecimal: null
    })
    expect(doc.errors).toHaveLength(2)
  })

  test('!!null', () => {
    const src =
`"empty":
"canonical": ~
"english": null
~: 'null key'`

    const doc = YAML.parseStream(src, { schema: 'json' })[0]
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
    const src =
`canonical: true
answer: FALSE
logical: True
option: TruE`

    expect(YAML.parse(src)).toMatchObject({
      canonical: true,
      answer: false,
      logical: true,
      option: true
    })
  })

  test('!!float', () => {
    const src =
`canonical: 6.8523015e+5
fixed: 685230.15
negative infinity: -.inf
not a number: .NaN`

    expect(YAML.parse(src)).toMatchObject({
      canonical: 685230.15,
      fixed: 685230.15,
      'negative infinity': Number.NEGATIVE_INFINITY,
      'not a number': NaN
    })
  })

  test('!!int', () => {
    const src =
`canonical: 685230
decimal: +685230
octal: 0o2472256
hexadecimal: 0x0A74AE`

    expect(YAML.parse(src)).toMatchObject({
      canonical: 685230,
      decimal: 685230,
      octal: 685230,
      hexadecimal: 685230
    })
  })

  test('!!null', () => {
    const src =
`empty:
canonical: ~
english: null
~: null key`

    expect(YAML.parse(src)).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
  })
})

describe('extended schema', () => {
  test('!!binary', () => {
    const src =
`canonical: !!binary "\\
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

    const doc = YAML.parseStream(src, { schema: 'extended' })[0]
    const canonical = doc.contents.items[0].value.value
    const generic = doc.contents.items[1].value.value
    expect(canonical).toBeInstanceOf(Uint8Array)
    expect(generic).toBeInstanceOf(Uint8Array)
    expect(canonical).toHaveLength(185)
    expect(generic).toHaveLength(185)
    let canonicalStr = ''
    let genericStr = ''
    for (let i = 0; i < canonical.length; ++i) canonicalStr += String.fromCharCode(canonical[i])
    for (let i = 0; i < generic.length; ++i) genericStr += String.fromCharCode(generic[i])
    expect(canonicalStr).toBe(genericStr)
    expect(canonicalStr.substr(0,5)).toBe('GIF89')
  })

  test('!!bool', () => {
    const src =
`canonical: y
answer: NO
logical: True
option: on`

    expect(YAML.parse(src, { schema: 'extended' })).toMatchObject({
      canonical: true,
      answer: false,
      logical: true,
      option: true
    })
  })

  test('!!float', () => {
    const src =
`canonical: 6.8523015e+5
exponential: 685.230_15e+03
fixed: 685_230.15
sexagesimal: 190:20:30.15
negative infinity: -.inf
not a number: .NaN`

    expect(YAML.parse(src, { schema: 'extended' })).toMatchObject({
      canonical: 685230.15,
      exponential: 685230.15,
      fixed: 685230.15,
      sexagesimal: 685230.15,
      'negative infinity': Number.NEGATIVE_INFINITY,
      'not a number': NaN
    })
  })

  test('!!int', () => {
    const src =
`canonical: 685230
decimal: +685_230
octal: 02472256
hexadecimal: 0x_0A_74_AE
binary: 0b1010_0111_0100_1010_1110
sexagesimal: 190:20:30`

    expect(YAML.parse(src, { schema: 'extended' })).toMatchObject({
      canonical: 685230,
      decimal: 685230,
      octal: 685230,
      hexadecimal: 685230,
      binary: 685230,
      sexagesimal: 685230
    })
  })

  test('!!null', () => {
    const src =
`empty:
canonical: ~
english: null
~: null key`

    expect(YAML.parse(src, { schema: 'extended' })).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
  })

  test('!!timestamp', () => {
    const src =
`canonical:       2001-12-15T02:59:43.1Z
valid iso8601:    2001-12-14t21:59:43.10-05:00
space separated:  2001-12-14 21:59:43.10 -5
no time zone (Z): 2001-12-15 2:59:43.10
date (00:00:00Z): 2002-12-14`

    expect(YAML.parse(src, { schema: 'extended' })).toMatchObject({
      canonical: '2001-12-15T02:59:43.100Z',
      'valid iso8601': '2001-12-15T02:59:43.100Z',
      'space separated': '2001-12-15T02:59:43.100Z',
      'no time zone (Z)': '2001-12-15T02:59:43.100Z',
      'date (00:00:00Z)': '2002-12-14T00:00:00.000Z'
    })
  })

})

describe('merge <<', () => {
  const src = `---
- &CENTER { x: 1, y: 2 }
- &LEFT { x: 0, y: 2 }
- &BIG { r: 10 }
- &SMALL { r: 1 }

# All the following maps are equal:

- # Explicit keys
  x: 1
  y: 2
  r: 10
  label: center/big

- # Merge one map
  << : *CENTER
  r: 10
  label: center/big

- # Merge multiple maps
  << : [ *CENTER, *BIG ]
  label: center/big

- # Override
  << : [ *BIG, *LEFT, *SMALL ]
  x: 1
  label: center/big`

  test('example', () => {
    const res = YAML.parse(src, { merge: true })
    expect(res).toHaveLength(8)
    for (let i = 4; i < res.length; ++i) {
      expect(res[i]).toMatchObject({ x: 1, y: 2, r: 10, label: 'center/big' })
    }
  })

  test('disabled merge', () => {
    const res = YAML.parse(src)
    expect(res).toHaveLength(8)
    for (let i = 5; i < res.length; ++i) {
      expect(res[i]).toHaveProperty('<<')
    }
  })
})

describe('custom tags', () => {
  const src =
`%TAG !e! tag:example.com,2000:test/
---
!e!x
- !y 2
- !e!z 3
- !<tag:example.com,2000:other/w> 4
- '5'`

  test('parse', () => {
    const doc = YAML.parseStream(src)[0]
    expect(doc.contents.tag).toBe('tag:yaml.org,2002:seq')
    expect(doc.contents.origTag).toBe('tag:example.com,2000:test/x')
    const { items } = doc.contents
    expect(items).toHaveLength(4)
    items.forEach(item => expect(item.tag).toBe('tag:yaml.org,2002:str'))
    expect(items[0].origTag).toBe('!y')
    expect(items[1].origTag).toBe('tag:example.com,2000:test/z')
    expect(items[2].origTag).toBe('tag:example.com,2000:other/w')
  })

  test('stringify', () => {
    const doc = YAML.parseStream(src)[0]
    expect(String(doc)).toBe(
`%TAG !e! tag:example.com,2000:test/
---
!e!x
- !y "2"
- !e!z "3"
- !<tag:example.com,2000:other/w> "4"
- "5"\n`
    )
  })

  test('modify', () => {
    const doc = YAML.parseStream(src)[0]
    doc.setTagPrefix('!f!', 'tag:example.com,2000:other/')
    doc.contents.commentBefore = 'c'
    doc.contents.items[3].comment = 'cc'
    const s = new Scalar(6)
    s.tag = 'tag:yaml.org,2002:str'
    s.origTag = '!g'
    doc.contents.items.splice(1, 1, s, '7')
    expect(String(doc)).toBe(
`%TAG !e! tag:example.com,2000:test/
%TAG !f! tag:example.com,2000:other/
---
#c
!e!x
- !y "2"
- !g "6"
- "7"
- !f!w "4"
- "5" #cc\n`
    )
  })
})
