import * as YAML from 'yaml'
import { Scalar, YAMLSeq } from 'yaml'
import { binary } from '../../src/tags/yaml-1.1/binary.js'
import { YAMLOMap } from '../../src/tags/yaml-1.1/omap.js'
import { YAMLSet } from '../../src/tags/yaml-1.1/set.js'

let origFoldOptions, origPrettyErrors

beforeAll(() => {
  origFoldOptions = YAML.scalarOptions.str.fold
  YAML.scalarOptions.str.fold = {
    lineWidth: 20,
    minContentWidth: 0
  }
  origPrettyErrors = YAML.defaultOptions.prettyErrors
  YAML.defaultOptions.prettyErrors = false
})

afterAll(() => {
  YAML.scalarOptions.str.fold = origFoldOptions
  YAML.defaultOptions.prettyErrors = origPrettyErrors
})

describe('json schema', () => {
  test('!!bool', () => {
    const src = `"canonical": true
"answer": false
"logical": True
"option": TruE`

    const doc = YAML.parseDocument(src, { schema: 'json' })
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

    const doc = YAML.parseDocument(src, { schema: 'json' })
    expect(doc.toJS()).toMatchObject({
      canonical: 685230.15,
      fixed: 685230.15,
      'negative infinity': '-.inf',
      'not a number': '.NaN'
    })
    expect(doc.errors).toHaveLength(2)
    doc.errors = []
    doc.contents.items[1].value.tag = 'tag:yaml.org,2002:float'
    expect(String(doc)).toBe(
      '"canonical": 685230.15\n"fixed": !!float 685230.15\n"negative infinity": "-.inf"\n"not a number": ".NaN"\n'
    )
  })

  test('!!int', () => {
    const src = `"canonical": 685230
"decimal": -685230
"octal": 0o2472256
"hexadecimal": 0x0A74AE`

    const doc = YAML.parseDocument(src, { schema: 'json' })
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

    const doc = YAML.parseDocument(src, { schema: 'json' })
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

    const doc = YAML.parseDocument(src)
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

    const doc = YAML.parseDocument(src)
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

    const doc = YAML.parseDocument(src)
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

    const doc = YAML.parseDocument(src)
    expect(doc.toJS()).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
    expect(String(doc)).toBe(`empty: null
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
      const doc = YAML.parseDocument(src, { logLevel: 'error' })
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
      const doc = YAML.parseDocument(src)
      expect(doc.toJS({ mapAsMap: true })).toMatchObject(
        new Map([
          ['one', 1],
          [2, 'two'],
          [new Map([[3, 4]]), 'many']
        ])
      )
      expect(doc.errors).toHaveLength(0)
      doc.contents.items[2].key = { 3: 4 }
      expect(doc.toJS({ mapAsMap: true })).toMatchObject(
        new Map([
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

    const doc = YAML.parseDocument(src, { schema: 'yaml-1.1' })
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
    YAML.scalarOptions.str.fold.lineWidth = 80
    expect(String(doc))
      .toBe(`canonical: !!binary "R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J\\
  +fn5OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/\\
  ++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLCAgjoEwnuNAFOhpEMTRiggcz4BN\\
  JHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs="
generic: !!binary |-
  R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5OTk6enp56enmlp
  aWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++SH+Dk1h
  ZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLCAgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYN
  G84BwwEeECcgggoBADs=
description: The binary value above is a tiny arrow encoded as a gif image.\n`)
    YAML.scalarOptions.str.fold.lineWidth = 20
  })

  test('!!bool', () => {
    const src = `
canonical: y
answer: NO
logical: True
option: on`

    const doc = YAML.parseDocument(src, { version: '1.1' })
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

    const doc = YAML.parseDocument(src)
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

    const doc = YAML.parseDocument(src)
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

    try {
      YAML.scalarOptions.int.asBigInt = true
      const doc = YAML.parseDocument(src)
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
    } finally {
      YAML.scalarOptions.int.asBigInt = false
    }
  })

  test('!!null', () => {
    const src = `%YAML 1.1
---
empty:
canonical: ~
english: null
~: null key`

    const doc = YAML.parseDocument(src)
    expect(doc.toJS()).toMatchObject({
      empty: null,
      canonical: null,
      english: null,
      '': 'null key'
    })
    expect(String(doc)).toBe(`%YAML 1.1
---
empty: null
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

      const doc = YAML.parseDocument(src)
      doc.contents.items.forEach(item => {
        expect(item.value.value).toBeInstanceOf(Date)
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
      const str = YAML.stringify(date) // stringified as !!str
      expect(str).toBe('2018-12-22T08:02:52.000Z\n')
      const str2 = YAML.stringify(date, { version: '1.1' })
      expect(str2).toBe('2018-12-22T08:02:52\n')
    })
  })

  describe('!!pairs', () => {
    for (const { name, src } of [
      { name: 'parse block seq', src: `!!pairs\n- a: 1\n- b: 2\n- a: 3\n` },
      { name: 'parse flow seq', src: `!!pairs [ a: 1, b: 2, a: 3 ]\n` }
    ])
      test(name, () => {
        const doc = YAML.parseDocument(src, { version: '1.1' })
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
      const doc = new YAML.Document(null, { version: '1.1' })
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
        const doc = YAML.parseDocument(src, { version: '1.1' })
        expect(doc.contents).toBeInstanceOf(YAMLOMap)
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
      const doc = YAML.parseDocument(src, { version: '1.1' })
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
      const str = YAML.stringify(map, { version: '1.1' })
      expect(str).toBe(`!!omap\n- a: 1\n- b: 2\n- c: 3\n`)
      const str2 = YAML.stringify(map)
      expect(str2).toBe(`a: 1\nb: 2\nc: 3\n`)
    })

    test('stringify Array', () => {
      const doc = new YAML.Document(null, { version: '1.1' })
      doc.contents = doc.createNode(
        [
          ['a', 1],
          ['b', 2],
          ['a', 3]
        ],
        { tag: '!!omap' }
      )
      expect(doc.contents).toBeInstanceOf(YAMLOMap)
      expect(String(doc)).toBe(`!!omap\n- a: 1\n- b: 2\n- a: 3\n`)
    })
  })

  describe('!!set', () => {
    for (const { name, src } of [
      { name: 'parse block map', src: `!!set\n? a\n? b\n? c\n` },
      { name: 'parse flow map', src: `!!set { a, b, c }\n` }
    ])
      test(name, () => {
        const doc = YAML.parseDocument(src, { version: '1.1' })
        expect(doc.contents).toBeInstanceOf(YAMLSet)
        expect(doc.toJS()).toBeInstanceOf(Set)
        expect(doc.toJS()).toMatchObject(new Set(['a', 'b', 'c']))
        expect(String(doc)).toBe(src)
      })

    test('require null values', () => {
      const src = `!!set\n? a\n? b\nc: d\n`
      const doc = YAML.parseDocument(src, { version: '1.1' })
      expect(doc.errors).toMatchObject([
        {
          name: 'YAMLParseError',
          message: 'Set items must all have null values'
        }
      ])
    })

    test('stringify', () => {
      const set = new Set(['a', 'b', 'c'])
      const str = YAML.stringify(set, { version: '1.1' })
      expect(str).toBe(`!!set\n? a\n? b\n? c\n`)
      const str2 = YAML.stringify(set)
      expect(str2).toBe(`- a\n- b\n- c\n`)
    })

    test('eemeli/yaml#78', () => {
      const set = new Set(['a', 'b', 'c'])
      const str = YAML.stringify({ set }, { version: '1.1' })
      expect(str).toBe(`set:\n  !!set\n  ? a\n  ? b\n  ? c\n`)
    })
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
    const doc = YAML.parseDocument(src)
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
    const doc = YAML.parseDocument(src)
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
    const doc = YAML.parseDocument(src)
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

  describe('custom tag objects', () => {
    const src = `!!binary |
      R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5
      OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+
      +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC
      AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs=`

    test('tag object in tags', () => {
      const bin = YAML.parse(src, { customTags: [binary] })
      expect(bin).toBeInstanceOf(Uint8Array)
    })

    test('tag array in tags', () => {
      const bin = YAML.parse(src, { customTags: [[binary]] })
      expect(bin).toBeInstanceOf(Uint8Array)
    })

    test('tag string in tags', () => {
      const bin = YAML.parse(src, { customTags: ['binary'] })
      expect(bin).toBeInstanceOf(Uint8Array)
    })

    test('tag string in tag array', () => {
      const bin = YAML.parse(src, { customTags: [['binary']] })
      expect(bin).toBeInstanceOf(Uint8Array)
    })

    test('custom tags from function', () => {
      const customTags = tags => tags.concat('binary')
      const bin = YAML.parse(src, { customTags })
      expect(bin).toBeInstanceOf(Uint8Array)
    })

    test('no custom tag object', () => {
      const bin = YAML.parse(src)
      expect(bin).toBeInstanceOf(Uint8Array)
    })
  })
})

describe('schema changes', () => {
  test('write as json', () => {
    const doc = YAML.parseDocument('foo: bar', { schema: 'core' })
    expect(doc.options.schema).toBe('core')
    doc.setSchema('json')
    expect(doc.options.schema).toBe('json')
    expect(String(doc)).toBe('"foo": "bar"\n')
  })

  test('fail for missing type', () => {
    const doc = YAML.parseDocument('foo: 1971-02-03T12:13:14', {
      version: '1.1'
    })
    expect(doc.options.version).toBe('1.1')
    expect(doc.directives.yaml).toMatchObject({
      version: '1.1',
      explicit: false
    })
    doc.setSchema('1.2')
    expect(doc.directives.yaml).toMatchObject({
      version: '1.2',
      explicit: false
    })
    expect(doc.options.version).toBe('1.1')
    expect(doc.options.schema).toBeUndefined()
    expect(() => String(doc)).toThrow(/Tag not resolved for Date value/)
  })

  test('set schema + custom tags', () => {
    const doc = YAML.parseDocument('foo: 1971-02-03T12:13:14', {
      version: '1.1'
    })
    doc.setSchema('json', ['timestamp'])
    expect(String(doc)).toBe('"foo": 1971-02-03T12:13:14\n')
  })

  test('set version + custom tags', () => {
    const doc = YAML.parseDocument('foo: 1971-02-03T12:13:14', {
      version: '1.1'
    })
    doc.setSchema(1.2, ['timestamp'])
    expect(String(doc)).toBe('foo: 1971-02-03T12:13:14\n')
  })

  test('schema changes on bool', () => {
    const doc = YAML.parseDocument('[y, yes, on, n, no, off]', {
      version: '1.1'
    })
    doc.setSchema('core')
    expect(String(doc)).toBe('[ true, true, true, false, false, false ]\n')
    doc.setSchema('1.1')
    expect(String(doc)).toBe('[ y, yes, on, n, no, off ]\n')
  })

  test('set bool + re-stringified', () => {
    let doc = YAML.parseDocument('a: True', {
      version: '1.2'
    })
    doc.set('a', false)
    expect(String(doc)).toBe('a: false\n')

    doc = YAML.parseDocument('a: on', {
      version: '1.1'
    })
    doc.set('a', false)
    expect(String(doc)).toBe('a: false\n')
  })
})
