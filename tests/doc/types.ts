import {
  CollectionTag,
  Document,
  DocumentOptions,
  Node,
  parse,
  ParsedNode,
  parseDocument as origParseDocument,
  ParseOptions,
  Scalar,
  ScalarTag,
  Schema,
  SchemaOptions,
  stringify,
  YAMLMap,
  YAMLSeq
} from 'yaml'
import { seqTag, stringifyString, stringTag } from 'yaml/util'
import { source } from '../_utils'

const parseDocument = <T extends Node = ParsedNode>(
  source: string,
  options?: ParseOptions & DocumentOptions & SchemaOptions
) => origParseDocument<T, false>(source, options)

describe('tags', () => {
  describe('implicit tags', () => {
    test('plain string', () => {
      const doc = parseDocument<Scalar>('foo')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.value).toBe('foo')
    })
    test('quoted string', () => {
      const doc = parseDocument<Scalar>('"foo"')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.value).toBe('foo')
    })
    test('flow map', () => {
      const doc = parseDocument('{ foo }')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.toJSON()).toMatchObject({ foo: null })
    })
    test('flow seq', () => {
      const doc = parseDocument('[ foo ]')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.toJSON()).toMatchObject(['foo'])
    })
    test('block map', () => {
      const doc = parseDocument('foo:\n')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.toJSON()).toMatchObject({ foo: null })
    })
    test('block seq', () => {
      const doc = parseDocument('- foo')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.toJSON()).toMatchObject(['foo'])
    })
  })

  describe('explicit tags', () => {
    test('plain string', () => {
      const doc = parseDocument<Scalar>('!!str foo')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:str')
      expect(doc.contents.value).toBe('foo')
    })
    test('quoted string', () => {
      const doc = parseDocument<Scalar>('!!str "foo"')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:str')
      expect(doc.contents.value).toBe('foo')
    })
    test('flow map', () => {
      const doc = parseDocument('!!map { foo }')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:map')
      expect(doc.contents.toJSON()).toMatchObject({ foo: null })
    })
    test('flow seq', () => {
      const doc = parseDocument('!!seq [ foo ]')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:seq')
      expect(doc.contents.toJSON()).toMatchObject(['foo'])
    })
    test('block map', () => {
      const doc = parseDocument('!!map\nfoo:\n')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:map')
      expect(doc.contents.toJSON()).toMatchObject({ foo: null })
    })
    test('block seq', () => {
      const doc = parseDocument('!!seq\n- foo')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:seq')
      expect(doc.contents.toJSON()).toMatchObject(['foo'])
    })
  })

  describe('invalid tags', () => {
    for (const tag of [
      '!t`ag x',
      '!t^ag x',
      '!t\\ag x',
      '!t<ag x',
      '!t>ag x',
      '!t,ag x',
      '!t"ag x'
    ]) {
      test(`invalid tag: ${tag}`, () => {
        const doc = parseDocument(tag)
        expect(doc.errors).not.toHaveLength(0)
        expect(doc.errors[0].code).toBe('MISSING_CHAR')
      })
    }

    test('malformed URI (eemeli/yaml#498)', () => {
      const doc = parseDocument('!!%ee 0')
      expect(doc.errors).toHaveLength(1)
      expect(doc.errors[0].message).toMatch('URIError')
    })

    test('CR in tag shorthand (eemeli/yaml#501', () => {
      const doc = parseDocument(': | !\r!')
      const err = doc.errors.find(err => err.code === 'TAG_RESOLVE_FAILED')
      expect(err).not.toBeFalsy()
    })
  })

  test('eemeli/yaml#97', () => {
    const doc = parseDocument('foo: !!float 3.0')
    expect(String(doc)).toBe('foo: !!float 3.0\n')
  })
})

describe('number types', () => {
  describe('intAsBigInt: false', () => {
    test('Version 1.1', () => {
      const src = `
- 0b10_10
- 0123
- -00
- 123_456
- 3.1e+2
- 5.1_2_3E-1
- 4.02
- 4.20
- .42
- 00.4`
      const doc = parseDocument<YAMLSeq>(src, {
        intAsBigInt: false,
        version: '1.1'
      })
      expect(doc.contents.items).toMatchObject([
        { value: 10, format: 'BIN' },
        { value: 83, format: 'OCT' },
        { value: -0, format: 'OCT' },
        { value: 123456 },
        { value: 310, format: 'EXP' },
        { value: 0.5123, format: 'EXP' },
        { value: 4.02 },
        { value: 4.2, minFractionDigits: 2 },
        { value: 0.42 },
        { value: 0.4 }
      ])
      expect(doc.contents.items[3]).not.toHaveProperty('format')
      expect(doc.contents.items[6]).not.toHaveProperty('format')
      expect(doc.contents.items[6]).not.toHaveProperty('minFractionDigits')
      expect(doc.contents.items[7]).not.toHaveProperty('format')
    })

    test('Version 1.2', () => {
      const src = `
- 0o123
- 0o0
- 123456
- 3.1e+2
- 5.123E-1
- 4.02
- 4.20
- .42
- 00.4`
      const doc = parseDocument<YAMLSeq>(src, {
        intAsBigInt: false,
        version: '1.2'
      })
      expect(doc.contents.items).toMatchObject([
        { value: 83, format: 'OCT' },
        { value: 0, format: 'OCT' },
        { value: 123456 },
        { value: 310, format: 'EXP' },
        { value: 0.5123, format: 'EXP' },
        { value: 4.02 },
        { value: 4.2, minFractionDigits: 2 },
        { value: 0.42 },
        { value: 0.4 }
      ])
      expect(doc.contents.items[2]).not.toHaveProperty('format')
      expect(doc.contents.items[5]).not.toHaveProperty('format')
      expect(doc.contents.items[5]).not.toHaveProperty('minFractionDigits')
      expect(doc.contents.items[6]).not.toHaveProperty('format')
    })
  })

  describe('intAsBigInt: true', () => {
    test('Version 1.1', () => {
      const src = `
- 0b10_10
- 0123
- -00
- 123_456
- 3.1e+2
- 5.1_2_3E-1
- 4.02`
      const doc = parseDocument<YAMLSeq>(src, {
        intAsBigInt: true,
        version: '1.1'
      })
      expect(doc.contents.items).toMatchObject([
        { value: 10n, format: 'BIN' },
        { value: 83n, format: 'OCT' },
        { value: 0n, format: 'OCT' },
        { value: 123456n },
        { value: 310, format: 'EXP' },
        { value: 0.5123, format: 'EXP' },
        { value: 4.02 }
      ])
      expect(doc.contents.items[3]).not.toHaveProperty('format')
      expect(doc.contents.items[6]).not.toHaveProperty('format')
      expect(doc.contents.items[6]).not.toHaveProperty('minFractionDigits')
    })

    test('Version 1.2', () => {
      const src = `
- 0o123
- 0o0
- 123456
- 3.1e+2
- 5.123E-1
- 4.02`
      const doc = parseDocument<YAMLSeq>(src, {
        intAsBigInt: true,
        version: '1.2'
      })
      expect(doc.contents.items).toMatchObject([
        { value: 83n, format: 'OCT' },
        { value: 0n, format: 'OCT' },
        { value: 123456n },
        { value: 310, format: 'EXP' },
        { value: 0.5123, format: 'EXP' },
        { value: 4.02 }
      ])
      expect(doc.contents.items[2]).not.toHaveProperty('format')
      expect(doc.contents.items[5]).not.toHaveProperty('format')
      expect(doc.contents.items[5]).not.toHaveProperty('minFractionDigits')
    })
  })
})

test('eemeli/yaml#2', () => {
  const src = `
aliases:
  - docker:
      - image: circleci/node:8.11.2
  - key: repository-{{ .Revision }}\n`
  expect(parse(src)).toMatchObject({
    aliases: [
      { docker: [{ image: 'circleci/node:8.11.2' }] },
      { key: 'repository-{{ .Revision }}' }
    ]
  })
})

describe('json schema', () => {
  test('!!bool', () => {
    const src = `"canonical": true
"answer": false
"logical": True
"option": TruE`

    const doc = parseDocument(src, { schema: 'json' })
    expect(doc.toJS()).toMatchObject({
      canonical: true,
      answer: false,
      logical: 'True',
      option: 'TruE'
    })
    expect(doc.errors).toHaveLength(2)
    doc.errors = []
    expect(String(doc)).toBe(
      '"canonical": true\n"answer": false\n"logical": "True"\n"option": "TruE"\n'
    )
  })

  test('!!float', () => {
    const src = `"canonical": 6.8523015e+5
"fixed": 685230.15
"negative infinity": -.inf
"not a number": .NaN`

    const doc = parseDocument<YAMLMap<Scalar, Scalar>>(src, { schema: 'json' })
    expect(doc.toJS()).toMatchObject({
      canonical: 685230.15,
      fixed: 685230.15,
      'negative infinity': '-.inf',
      'not a number': '.NaN'
    })
    expect(doc.errors).toHaveLength(2)
    doc.errors = []
    doc.contents.items[1].value!.tag = 'tag:yaml.org,2002:float'
    expect(String(doc)).toBe(
      '"canonical": 685230.15\n"fixed": !!float 685230.15\n"negative infinity": "-.inf"\n"not a number": ".NaN"\n'
    )
  })

  test('!!int', () => {
    const src = `"canonical": 685230
"decimal": -685230
"octal": 0o2472256
"hexadecimal": 0x0A74AE`

    const doc = parseDocument(src, { schema: 'json' })
    expect(doc.toJS()).toMatchObject({
      canonical: 685230,
      decimal: -685230,
      octal: '0o2472256',
      hexadecimal: '0x0A74AE'
    })
    expect(doc.errors).toHaveLength(2)
    doc.errors = []
    doc.set('bigint', 42n)
    expect(String(doc)).toBe(
      '"canonical": 685230\n"decimal": -685230\n"octal": "0o2472256"\n"hexadecimal": "0x0A74AE"\n"bigint": 42\n'
    )
  })

  test('!!null', () => {
    const src = `"empty":
"canonical": ~
"english": null
~: 'null key'`

    const doc = parseDocument(src, { schema: 'json' })
    expect(doc.toJS()).toMatchObject({
      empty: '',
      canonical: '~',
      english: null,
      '~': 'null key'
    })
    expect(doc.errors).toHaveLength(3)
    doc.errors = []
    expect(String(doc)).toBe(`"empty": ""
"canonical": "~"
"english": null
"~": "null key"\n`)
  })
})

describe('core schema', () => {
  test('!!bool', () => {
    const src = `canonical: true
answer: FALSE
logical: True
option: TruE\n`

    const doc = parseDocument(src)
    expect(doc.toJS()).toMatchObject({
      canonical: true,
      answer: false,
      logical: true,
      option: 'TruE'
    })
    expect(String(doc)).toBe(`canonical: true
answer: FALSE
logical: True
option: TruE\n`)
  })

  test('!!float', () => {
    const src = `canonical: 6.8523015e+5
fixed: 685230.15
negative infinity: -.inf
not a number: .NaN`

    const doc = parseDocument(src)
    expect(doc.toJS()).toMatchObject({
      canonical: 685230.15,
      fixed: 685230.15,
      'negative infinity': Number.NEGATIVE_INFINITY,
      'not a number': NaN
    })
    expect(String(doc)).toBe(`canonical: 6.8523015e+5
fixed: 685230.15
negative infinity: -.inf
not a number: .nan\n`)
  })

  test('!!int', () => {
    const src = `canonical: 685230
decimal: +685230
octal: 0o2472256
hexadecimal: 0x0A74AE`

    const doc = parseDocument(src)
    expect(doc.toJS()).toMatchObject({
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

    const doc = parseDocument(src)
    expect(doc.toJS()).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
    expect(String(doc)).toBe(`empty:
canonical: ~
english: null
~: null key\n`)
  })

  describe('!!map', () => {
    test('mapAsMap: false', () => {
      const src = `
one: 1
2: two
{ 3: 4 }: many\n`
      const doc = parseDocument<YAMLMap>(src, { logLevel: 'error' })
      expect(doc.toJS()).toMatchObject({
        one: 1,
        2: 'two',
        '{ 3: 4 }': 'many'
      })
      expect(doc.errors).toHaveLength(0)
      doc.contents.items[2].key = { 3: 4 }
      expect(doc.toJS()).toMatchObject({
        one: 1,
        2: 'two',
        '{"3":4}': 'many'
      })
    })

    test('mapAsMap: true', () => {
      const src = `
one: 1
2: two
{ 3: 4 }: many\n`
      const doc = parseDocument<YAMLMap>(src)
      expect(doc.toJS({ mapAsMap: true })).toMatchObject(
        new Map<unknown, unknown>([
          ['one', 1],
          [2, 'two'],
          [new Map([[3, 4]]), 'many']
        ])
      )
      expect(doc.errors).toHaveLength(0)
      doc.contents.items[2].key = { 3: 4 }
      expect(doc.toJS({ mapAsMap: true })).toMatchObject(
        new Map<unknown, unknown>([
          ['one', 1],
          [2, 'two'],
          [{ 3: 4 }, 'many']
        ])
      )
    })
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

    const doc = parseDocument<YAMLMap<Scalar, Scalar<Uint8Array>>>(src, {
      schema: 'yaml-1.1'
    })
    const canonical = doc.contents.items[0].value!.value
    const generic = doc.contents.items[1].value!.value
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
    expect(canonicalStr.substring(0, 5)).toBe('GIF89')
    expect(String(doc))
      .toBe(`canonical: !!binary "R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J\\
  +fn5OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/\\
  ++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLCAgjoEwnuNAFOhpEMTRiggcz4BN\\
  JHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs="
generic: !!binary |-
  R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5OTk6enp56enmlpaW
  NjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++SH+Dk1hZGUg
  d2l0aCBHSU1QACwAAAAADAAMAAAFLCAgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84Bww
  EeECcgggoBADs=
description: The binary value above is a tiny arrow encoded as a gif image.\n`)
  })

  test('!!bool', () => {
    const src = `
canonical: y
answer: NO
logical: True
option: on`

    const doc = parseDocument(src, { version: '1.1' })
    expect(doc.toJS()).toMatchObject({
      canonical: true,
      answer: false,
      logical: true,
      option: true
    })
    expect(String(doc)).toBe(`canonical: y
answer: NO
logical: True
option: on\n`)
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

    const doc = parseDocument(src)
    expect(doc.toJS()).toMatchObject({
      canonical: 685230.15,
      exponential: 685230.15,
      fixed: 685230.15,
      sexagesimal: 685230.15,
      'negative infinity': Number.NEGATIVE_INFINITY,
      'not a number': NaN
    })
    expect(String(doc)).toBe(`%YAML 1.1
---
canonical: 6.8523015e+5
exponential: 6.8523015e+5
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

    const doc = parseDocument(src)
    expect(doc.toJS()).toMatchObject({
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

  test('!!int, asBigInt', () => {
    const src = `%YAML 1.1
---
canonical: 685230
decimal: +685_230
octal: 02472256
hexadecimal: 0x_0A_74_AE
binary: 0b1010_0111_0100_1010_1110
sexagesimal: 190:20:30`

    const doc = parseDocument(src, { intAsBigInt: true })
    expect(doc.toJS()).toMatchObject({
      canonical: 685230n,
      decimal: 685230n,
      octal: 685230n,
      hexadecimal: 685230n,
      binary: 685230n,
      sexagesimal: 685230n
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

    const doc = parseDocument(src)
    expect(doc.toJS()).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
    expect(String(doc)).toBe(`%YAML 1.1
---
empty:
canonical: ~
english: null
~: null key\n`)
  })

  describe('!!timestamp', () => {
    test('parse & document', () => {
      const src = `%YAML 1.1
---
canonical:        2001-12-15T02:59:43.1Z
valid iso8601:    2001-12-14t21:59:43.10-05:00
space separated:  2001-12-14 21:59:43.10 -5
no time zone (Z): 2001-12-15 2:59:43.10
date (00:00:00Z): 2002-12-14`

      const doc = parseDocument<YAMLMap<Scalar, Scalar>>(src)
      doc.contents.items.forEach(item => {
        expect(item.value!.value).toBeInstanceOf(Date)
      })
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
date (00:00:00Z): 2002-12-14\n`)
    })

    test('stringify', () => {
      const date = new Date('2018-12-22T08:02:52Z')
      const str = stringify(date) // stringified as !!str
      expect(str).toBe('2018-12-22T08:02:52.000Z\n')
      const str2 = stringify(date, { version: '1.1' })
      expect(str2).toBe('2018-12-22T08:02:52\n')
    })
  })

  describe('!!pairs', () => {
    for (const { name, src } of [
      { name: 'parse block seq', src: `!!pairs\n- a: 1\n- b: 2\n- a: 3\n` },
      { name: 'parse flow seq', src: `!!pairs [ a: 1, b: 2, a: 3 ]\n` }
    ])
      test(name, () => {
        const doc = parseDocument<YAMLSeq>(src, { version: '1.1' })
        expect(doc.contents).toBeInstanceOf(YAMLSeq)
        expect(doc.contents.items).toMatchObject([
          { key: { value: 'a' }, value: { value: 1 } },
          { key: { value: 'b' }, value: { value: 2 } },
          { key: { value: 'a' }, value: { value: 3 } }
        ])
        expect(doc.toJS()).toBeInstanceOf(Array)
        expect(doc.toJS()).toMatchObject([{ a: 1 }, { b: 2 }, { a: 3 }])
        expect(String(doc)).toBe(src)
      })

    test('stringify', () => {
      const doc = new Document(null, { version: '1.1' })
      doc.contents = doc.createNode(
        [
          ['a', 1],
          ['b', 2],
          ['a', 3]
        ],
        { tag: '!!pairs' }
      )
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:pairs')
      expect(String(doc)).toBe(`!!pairs\n- a: 1\n- b: 2\n- a: 3\n`)
    })
  })

  describe('!!omap', () => {
    for (const { name, src } of [
      { name: 'parse block seq', src: `!!omap\n- a: 1\n- b: 2\n- c: 3\n` },
      { name: 'parse flow seq', src: `!!omap [ a: 1, b: 2, c: 3 ]\n` }
    ])
      test(name, () => {
        const doc = parseDocument<any>(src, { version: '1.1' })
        expect(doc.contents.constructor.tag).toBe('tag:yaml.org,2002:omap')
        expect(doc.toJS()).toBeInstanceOf(Map)
        expect(doc.toJS()).toMatchObject(
          new Map([
            ['a', 1],
            ['b', 2],
            ['c', 3]
          ])
        )
        expect(String(doc)).toBe(src)
      })

    test('require unique keys', () => {
      const src = `!!omap\n- a: 1\n- b: 2\n- b: 9\n`
      const doc = parseDocument(src, {
        prettyErrors: false,
        version: '1.1'
      })
      expect(doc.errors).toMatchObject([
        {
          name: 'YAMLParseError',
          message: 'Ordered maps must not include duplicate keys: b'
        }
      ])
    })

    test('stringify Map', () => {
      const map = new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3]
      ])
      const str = stringify(map, { version: '1.1' })
      expect(str).toBe(`!!omap\n- a: 1\n- b: 2\n- c: 3\n`)
      const str2 = stringify(map)
      expect(str2).toBe(`a: 1\nb: 2\nc: 3\n`)
    })

    test('stringify Array', () => {
      const doc = new Document<any>(null, { version: '1.1' })
      doc.contents = doc.createNode(
        [
          ['a', 1],
          ['b', 2],
          ['a', 3]
        ],
        { tag: '!!omap' }
      )
      expect(doc.contents.constructor.tag).toBe('tag:yaml.org,2002:omap')
      expect(String(doc)).toBe(`!!omap\n- a: 1\n- b: 2\n- a: 3\n`)
    })
  })

  describe('!!set', () => {
    for (const { name, src } of [
      { name: 'parse block map', src: `!!set\n? a\n? b\n? c\n` },
      { name: 'parse flow map', src: `!!set { a, b, c }\n` }
    ])
      test(name, () => {
        const doc = parseDocument<any>(src, { version: '1.1' })
        expect(doc.contents.constructor.tag).toBe('tag:yaml.org,2002:set')
        expect(doc.toJS()).toBeInstanceOf(Set)
        expect(doc.toJS()).toMatchObject(new Set(['a', 'b', 'c']))
        expect(String(doc)).toBe(src)
      })

    test('require null values', () => {
      const src = `!!set\n? a\n? b\nc: d\n`
      const doc = parseDocument(src, {
        prettyErrors: false,
        version: '1.1'
      })
      expect(doc.errors).toMatchObject([
        {
          name: 'YAMLParseError',
          message: 'Set items must all have null values'
        }
      ])
    })

    test('stringify', () => {
      const set = new Set(['a', 'b', 'c'])
      const str = stringify(set, { version: '1.1' })
      expect(str).toBe(`!!set\n? a\n? b\n? c\n`)
      const str2 = stringify(set)
      expect(str2).toBe(`- a\n- b\n- c\n`)
    })

    test('eemeli/yaml#78', () => {
      const set = new Set(['a', 'b', 'c'])
      const str = stringify({ set }, { version: '1.1' })
      expect(str).toBe(source`
        set: !!set
          ? a
          ? b
          ? c
      `)
    })
  })

  describe('!!merge', () => {
    test('alias', () => {
      const src = '- &a { a: A, b: B }\n- { <<: *a, b: X }\n'
      const doc = parseDocument(src, { version: '1.1' })
      expect(doc.toJS()).toMatchObject([
        { a: 'A', b: 'B' },
        { a: 'A', b: 'X' }
      ])
      expect(doc.toString()).toBe(src)
    })

    test('alias sequence', () => {
      const src =
        '- &a { a: A, b: B, c: C }\n- &b { a: X }\n- { <<: [ *b, *a ], b: X }\n'
      const doc = parseDocument(src, { version: '1.1' })
      expect(doc.toJS()).toMatchObject([
        { a: 'A', b: 'B' },
        { a: 'X' },
        { a: 'X', b: 'X', c: 'C' }
      ])
      expect(doc.toString()).toBe(src)
    })

    test('explicit creation', () => {
      const src = '- { a: A, b: B }\n- { b: X }\n'
      const doc = parseDocument(src, { version: '1.1' })
      const alias = doc.createAlias(doc.get(0), 'a')
      doc.addIn([1], doc.createPair('<<', alias))
      expect(doc.toString()).toBe('- &a { a: A, b: B }\n- { b: X, <<: *a }\n')
      expect(doc.toJS()).toMatchObject([
        { a: 'A', b: 'B' },
        { a: 'A', b: 'X' }
      ])
    })

    test('creation by duck typing', () => {
      const src = '- { a: A, b: B }\n- { b: X }\n'
      const doc = parseDocument(src, { version: '1.1' })
      const alias = doc.createAlias(doc.get(0), 'a')
      doc.addIn([1], doc.createPair('<<', alias))
      expect(doc.toString()).toBe('- &a { a: A, b: B }\n- { b: X, <<: *a }\n')
      expect(doc.toJS()).toMatchObject([
        { a: 'A', b: 'B' },
        { a: 'A', b: 'X' }
      ])
    })
  })
})

describe('custom tags', () => {
  describe('local', () => {
    const src = source`
      %TAG !e! tag:example.com,2000:test/
      ---
      !e!x
      - !y 2
      - !e!z 3
      - !<tag:example.com,2000:other/w> 4
      - '5'
    `

    test('parse', () => {
      const doc = parseDocument<YAMLSeq<Scalar>>(src)
      expect(doc.contents).toBeInstanceOf(YAMLSeq)
      expect(doc.contents.tag).toBe('tag:example.com,2000:test/x')
      const { items } = doc.contents
      expect(items).toHaveLength(4)
      items.forEach(item => expect(typeof item.value).toBe('string'))
      expect(items[0].tag).toBe('!y')
      expect(items[1].tag).toBe('tag:example.com,2000:test/z')
      expect(items[2].tag).toBe('tag:example.com,2000:other/w')
    })

    test('stringify', () => {
      const doc = parseDocument(src)
      expect(String(doc)).toBe(source`
        %TAG !e! tag:example.com,2000:test/
        ---
        !e!x
        - !y "2"
        - !e!z "3"
        - !<tag:example.com,2000:other/w> "4"
        - '5'
      `)
    })

    test('modify', () => {
      const doc = parseDocument<YAMLSeq<Scalar>>(src)
      const prefix = 'tag:example.com,2000:other/'
      doc.directives.tags['!f!'] = prefix
      expect(doc.directives.tags).toMatchObject({
        '!!': 'tag:yaml.org,2002:',
        '!e!': 'tag:example.com,2000:test/',
        '!f!': prefix
      })

      doc.contents.commentBefore = 'c'
      doc.contents.items[3].comment = 'cc'
      const s = new Scalar(6)
      s.tag = '!g'
      // @ts-expect-error TS should complain here
      doc.contents.items.splice(1, 1, s, '7')
      expect(String(doc)).toBe(source`
        %TAG !e! tag:example.com,2000:test/
        %TAG !f! tag:example.com,2000:other/
        ---
        #c
        !e!x
        - !y "2"
        - !g 6
        - "7"
        - !f!w "4"
        - '5' #cc
      `)
    })
  })

  describe('!!binary', () => {
    const src = `!!binary |
      R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5
      OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+
      +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC
      AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs=`

    test('tag string in tags', () => {
      const bin = parse(src, { customTags: ['binary'] })
      expect(bin).toBeInstanceOf(Uint8Array)
    })

    test('tag string in tag array', () => {
      // @ts-expect-error TS should complain here
      const bin = parse(src, { customTags: [['binary']] })
      expect(bin).toBeInstanceOf(Uint8Array)
    })

    test('custom tags from function', () => {
      const bin = parse(src, { customTags: tags => tags.concat('binary') })
      expect(bin).toBeInstanceOf(Uint8Array)
    })

    test('no custom tag object', () => {
      const bin = parse(src)
      expect(bin).toBeInstanceOf(Uint8Array)
    })
  })

  const regexp: ScalarTag = {
    identify: value => value instanceof RegExp,
    tag: '!re',
    resolve(str) {
      const match = str.match(/^\/([\s\S]+)\/([gimuy]*)$/)!
      return new RegExp(match[1], match[2])
    }
  }

  const sharedSymbol: ScalarTag = {
    identify: (value: any) => value.constructor === Symbol,
    tag: '!symbol/shared',
    resolve: str => Symbol.for(str),
    stringify(item, ctx, onComment, onChompKeep) {
      const key = Symbol.keyFor(item.value as symbol)
      if (key === undefined)
        throw new Error('Only shared symbols are supported')
      return stringifyString({ value: key }, ctx, onComment, onChompKeep)
    }
  }

  class YAMLNullObject<S, T> extends YAMLMap<S, T> {
    tag: string = '!nullobject'
    toJSON(_?: unknown, ctx?: any): any {
      const obj = super.toJSON<Record<any, any>>(
        _,
        { ...(ctx || {}), mapAsMap: false },
        Object
      )
      return Object.assign(Object.create(null), obj)
    }
  }
  const nullObject: CollectionTag = {
    tag: '!nullobject',
    collection: 'map',
    identify: (value: any) =>
      !!value && typeof value === 'object' && !Object.getPrototypeOf(value),
    nodeClass: YAMLNullObject
  }

  describe('RegExp', () => {
    test('stringify as plain scalar', () => {
      const str = stringify(/re/g, { customTags: [regexp] })
      expect(str).toBe('!re /re/g\n')
      const res = parse(str, { customTags: [regexp] })
      expect(res).toBeInstanceOf(RegExp)
    })

    test('stringify as quoted scalar', () => {
      const str = stringify(/re: /g, { customTags: [regexp] })
      expect(str).toBe('!re "/re: /g"\n')
      const res = parse(str, { customTags: [regexp] })
      expect(res).toBeInstanceOf(RegExp)
    })

    test('parse plain string as string', () => {
      const res = parse('/re/g', { customTags: [regexp] })
      expect(res).toBe('/re/g')
    })

    test('parse quoted string as string', () => {
      const res = parse('"/re/g"', { customTags: [regexp] })
      expect(res).toBe('/re/g')
    })
  })

  describe('Symbol', () => {
    test('stringify as plain scalar', () => {
      const symbol = Symbol.for('foo')
      const str = stringify(symbol, { customTags: [sharedSymbol] })
      expect(str).toBe('!symbol/shared foo\n')
      const res = parse(str, { customTags: [sharedSymbol] })
      expect(res).toBe(symbol)
    })

    test('stringify as block scalar', () => {
      const symbol = Symbol.for('foo\nbar')
      const str = stringify(symbol, { customTags: [sharedSymbol] })
      expect(str).toBe('!symbol/shared |-\nfoo\nbar\n')
      const res = parse(str, { customTags: [sharedSymbol] })
      expect(res).toBe(symbol)
    })
  })

  test('null prototyped object', () => {
    const obj = Object.assign(Object.create(null), { x: 'y', z: 1 })
    const str = stringify(obj, { customTags: [nullObject] })
    expect(str).toBe('!nullobject\nx: y\nz: 1\n')
    const res = parse(str, { customTags: [nullObject] })
    expect(Object.getPrototypeOf(res)).toBe(null)
    expect(res).toMatchObject(obj)
  })

  test('cannot parse sequence as nullobject', () => {
    const str = '!nullobject\n- y\n- 1\n'
    const doc = origParseDocument(str)
    expect(doc.warnings).toMatchObject([{ code: 'TAG_RESOLVE_FAILED' }])
  })

  test('array within customTags', () => {
    const obj = { re: /re/g, symbol: Symbol.for('foo') }
    // @ts-expect-error TS should complain here
    const str = stringify(obj, { customTags: [[regexp, sharedSymbol]] })
    expect(str).toBe('re: !re /re/g\nsymbol: !symbol/shared foo\n')
  })

  describe('schema from custom tags', () => {
    test('customTags is required', () => {
      expect(() => parseDocument('foo', { schema: 'custom-test' })).toThrow(
        /Unknown schema "custom-test"/
      )
    })

    test('parse success', () => {
      const src = '- foo\n- !re /bar/\n'
      const doc = parseDocument(src, {
        customTags: [seqTag, stringTag, regexp],
        schema: 'custom-test'
      })
      expect(doc.errors).toEqual([])
      expect(doc.warnings).toEqual([])
      expect(doc.schema.name).toBe('custom-test')
      expect(doc.toJS()).toEqual(['foo', /bar/])
    })

    test('parse fail', () => {
      // map, seq & string are always parsed, even if not included
      const src = '- foo\n- !re /bar/\n'
      const doc = parseDocument(src, {
        customTags: [],
        schema: 'custom-test'
      })
      expect(doc.errors).toEqual([])
      expect(doc.warnings).toHaveLength(1)
      expect(doc.warnings[0].message).toMatch(/Unresolved tag: !re/)
    })

    test('stringify success', () => {
      let src = '- foo\n'
      let doc = parseDocument(src, {
        customTags: [seqTag, stringTag],
        schema: 'custom-test'
      })
      expect(doc.toString()).toBe(src)

      src = '- foo\n- !re /bar/\n'
      doc = parseDocument(src, {
        customTags: [seqTag, stringTag, regexp],
        schema: 'custom-test'
      })
      expect(doc.toString()).toBe(src)
    })

    test('stringify fail', () => {
      const src = '- foo\n'
      let doc = parseDocument(src, {
        customTags: [],
        schema: 'custom-test'
      })
      expect(() => String(doc)).toThrow(/Tag not resolved for YAMLSeq value/)

      doc = parseDocument(src, {
        customTags: [seqTag],
        schema: 'custom-test'
      })
      expect(() => String(doc)).toThrow(/Tag not resolved for String value/)
    })

    test('setSchema', () => {
      const src = '- foo\n'
      const doc = parseDocument(src)

      doc.setSchema('1.2', {
        customTags: [seqTag, stringTag],
        schema: 'custom-test-1'
      })
      expect(doc.toString()).toBe(src)

      doc.setSchema('1.2', {
        customTags: [stringTag],
        schema: 'custom-test-2'
      })
      expect(() => String(doc)).toThrow(/Tag not resolved for YAMLSeq value/)
    })
  })
})

describe('schema changes', () => {
  test('write as json', () => {
    const doc = parseDocument('foo: bar', { schema: 'core' })
    expect(doc.schema.name).toBe('core')
    doc.setSchema('1.2', { schema: 'json' })
    expect(doc.schema.name).toBe('json')
    expect(String(doc)).toBe('"foo": "bar"\n')
  })

  test('fail for missing type', () => {
    const doc = parseDocument('foo: 1971-02-03T12:13:14', {
      version: '1.1'
    })
    expect(doc.directives.yaml).toMatchObject({
      version: '1.1',
      explicit: false
    })
    doc.setSchema('1.2')
    expect(doc.directives.yaml).toMatchObject({
      version: '1.2',
      explicit: false
    })
    expect(doc.schema.name).toBe('core')
    expect(() => String(doc)).toThrow(/Tag not resolved for Date value/)
  })

  test('set schema + custom tags', () => {
    const doc = parseDocument('foo: 1971-02-03T12:13:14', {
      version: '1.1'
    })
    doc.setSchema('1.1', { customTags: ['timestamp'], schema: 'json' })
    expect(String(doc)).toBe('"foo": 1971-02-03T12:13:14\n')
  })

  test('set version + custom tags', () => {
    const doc = parseDocument('foo: 1971-02-03T12:13:14', {
      version: '1.1'
    })
    // @ts-expect-error TS should complain here
    doc.setSchema(1.2, { customTags: ['timestamp'] })
    expect(String(doc)).toBe('foo: 1971-02-03T12:13:14\n')
  })

  test('schema changes on bool', () => {
    const doc = parseDocument('[y, yes, on, n, no, off]', {
      version: '1.1'
    })
    doc.setSchema('1.1', { schema: 'core' })
    expect(String(doc)).toBe('[ true, true, true, false, false, false ]\n')
    doc.setSchema('1.1')
    expect(String(doc)).toBe('[ y, yes, on, n, no, off ]\n')
  })

  test('set bool + re-stringified', () => {
    let doc = parseDocument('a: True', {
      version: '1.2'
    })
    doc.set('a', false)
    expect(String(doc)).toBe('a: false\n')

    doc = parseDocument('a: on', {
      version: '1.1'
    })
    doc.set('a', false)
    expect(String(doc)).toBe('a: false\n')
  })

  test('custom schema instance', () => {
    const src = '[ !!bool yes, &foo no, *foo ]'
    const doc = parseDocument(src, { version: '1.1' })

    const core = new Schema({ schema: 'core' })
    doc.setSchema('1.2', { schema: core })
    expect(String(doc)).toBe('[ !!bool true, &foo false, *foo ]\n')

    const yaml11 = new Schema({ schema: 'yaml-1.1' })
    doc.setSchema('1.1', { schema: Object.assign({}, yaml11) })
    expect(String(doc)).toBe('[ !!bool yes, &foo no, *foo ]\n')

    doc.setSchema(null, { schema: core })
    expect(String(doc)).toBe('[ true, false, false ]\n')
  })

  test('null version requires Schema instance', () => {
    const doc = parseDocument('foo: bar')
    const msg =
      'With a null YAML version, the { schema: Schema } option is required'
    expect(() => doc.setSchema(null)).toThrow(msg)
    expect(() => doc.setSchema(null, { schema: 'core' })).toThrow(msg)
    doc.setSchema(null, { schema: doc.schema })
    expect(doc.toString()).toBe('foo: bar\n')
  })
})
