import resolve from '../src/index'
import { Schema } from '../src/Tags'

describe(Schema.JSON, () => {
  test('!!bool', () => {
    const src =
`"canonical": true
"answer": false
"logical": True
"option": TruE`

    const doc = resolve(src, { schema: Schema.JSON })[0]
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

    const doc = resolve(src, { schema: Schema.JSON })[0]
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

    const doc = resolve(src, { schema: Schema.JSON })[0]
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

    const doc = resolve(src, { schema: Schema.JSON })[0]
    expect(doc.toJSON()).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
    expect(doc.errors).toHaveLength(2)
  })
})

describe(Schema.CORE, () => {
  test('!!bool', () => {
    const src =
`canonical: true
answer: FALSE
logical: True
option: TruE`

    const doc = resolve(src)[0]
    expect(doc.toJSON()).toMatchObject({
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

    const doc = resolve(src)[0]
    expect(doc.toJSON()).toMatchObject({
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

    const doc = resolve(src)[0]
    expect(doc.toJSON()).toMatchObject({
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

    const doc = resolve(src)[0]
    expect(doc.toJSON()).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
  })
})

describe(Schema.EXTENDED, () => {
  test('!!binary', () => {
    const src =
`canonical: !!binary "\
 R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5\
 OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+\
 +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC\
 AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs="
generic: !!binary |
 R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5
 OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+
 +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC
 AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs=
description:
 The binary value above is a tiny arrow encoded as a gif image.`

    const doc = resolve(src, { schema: Schema.EXTENDED })[0]
    const canonical = doc.contents.items[0].value
    const generic = doc.contents.items[1].value
    expect(canonical).toBeInstanceOf(Uint8Array)
    expect(generic).toBeInstanceOf(Uint8Array)
    expect(canonical).toHaveLength(185)
    expect(generic).toHaveLength(185)
    let canonicalStr = ''
    let genericStr = ''
    for (let i = 0; i < canonical.length; ++i) canonicalStr += String.fromCharCode(canonical[i])
    for (let i = 0; i < generic.length; ++i) genericStr += String.fromCharCode(generic[i])
    expect(canonicalStr).toBe(genericStr)
    expect(canonicalStr.substr(0,3)).toBe('GIF')
  })

  test('!!bool', () => {
    const src =
`canonical: y
answer: NO
logical: True
option: on`

    const doc = resolve(src, { schema: Schema.EXTENDED })[0]
    expect(doc.toJSON()).toMatchObject({
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

    const doc = resolve(src, { schema: Schema.EXTENDED })[0]
    expect(doc.toJSON()).toMatchObject({
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
octal: 0o2472256
hexadecimal: 0x_0A_74_AE
binary: 0b1010_0111_0100_1010_1110
sexagesimal: 190:20:30`

    const doc = resolve(src, { schema: Schema.EXTENDED })[0]
    expect(doc.toJSON()).toMatchObject({
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

    const doc = resolve(src, { schema: Schema.EXTENDED })[0]
    expect(doc.toJSON()).toMatchObject({
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

    const doc = resolve(src, { schema: Schema.EXTENDED })[0]
    expect(doc.toJSON()).toMatchObject({
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
    const doc = resolve(src)[0].toJSON()
    expect(doc).toHaveLength(8)
    for (let i = 4; i < doc.length; ++i) {
      expect(doc[i]).toMatchObject({ x: 1, y: 2, r: 10, label: 'center/big' })
    }
  })

  test('disabled merge', () => {
    const doc = resolve(src, { merge: false })[0].toJSON()
    expect(doc).toHaveLength(8)
    for (let i = 5; i < doc.length; ++i) {
      expect(doc[i]).toHaveProperty('<<')
    }
  })
})
