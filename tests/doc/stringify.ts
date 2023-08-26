import { source } from '../_utils'
import * as YAML from 'yaml'
import { Pair, Scalar } from 'yaml'

for (const [name, version] of [
  ['YAML 1.1', '1.1'],
  ['YAML 1.2', '1.2']
] as const) {
  describe(name, () => {
    test('undefined', () => {
      expect(YAML.stringify(undefined, { version })).toBeUndefined()
    })

    test('null', () => {
      expect(YAML.stringify(null, { version })).toBe('null\n')
    })

    describe('boolean', () => {
      test('true', () => {
        expect(YAML.stringify(true, { version })).toBe('true\n')
      })
      test('false', () => {
        expect(YAML.stringify(false, { version })).toBe('false\n')
      })
      test('Boolean', () => {
        expect(YAML.stringify(new Boolean(true), { version })).toBe('true\n')
      })
    })

    describe('number', () => {
      test('integer', () => {
        expect(YAML.stringify(3, { version })).toBe('3\n')
      })
      test('float', () => {
        expect(YAML.stringify(3.141, { version })).toBe('3.141\n')
      })
      test('zero', () => {
        expect(YAML.stringify(0, { version })).toBe('0\n')
      })
      test('NaN', () => {
        expect(YAML.stringify(NaN, { version })).toBe('.nan\n')
      })
      test('Number', () => {
        expect(YAML.stringify(new Number(3.141), { version })).toBe('3.141\n')
      })

      test('float with trailing zeros', () => {
        const doc = new YAML.Document<YAML.Scalar, false>(3, { version })
        doc.contents.minFractionDigits = 2
        expect(String(doc)).toBe('3.00\n')
      })
      test('scientific float ignores minFractionDigits', () => {
        const doc = new YAML.Document<YAML.Scalar, false>(3, { version })
        doc.contents.format = 'EXP'
        doc.contents.minFractionDigits = 2
        expect(String(doc)).toBe('3e+0\n')
      })

      test('integer with HEX format', () => {
        const doc = new YAML.Document<YAML.Scalar, false>(42, { version })
        doc.contents.format = 'HEX'
        expect(String(doc)).toBe('0x2a\n')
      })
      test('float with HEX format', () => {
        const doc = new YAML.Document<YAML.Scalar, false>(4.2, { version })
        doc.contents.format = 'HEX'
        expect(String(doc)).toBe('4.2\n')
      })
      test('negative integer with HEX format', () => {
        const doc = new YAML.Document<YAML.Scalar, false>(-42, { version })
        doc.contents.format = 'HEX'
        const exp = version === '1.2' ? '-42\n' : '-0x2a\n'
        expect(String(doc)).toBe(exp)
      })

      test('bigint', () => {
        expect(YAML.stringify(BigInt('-42'), { version })).toBe('-42\n')
      })
      test('BigInt', () => {
        expect(YAML.stringify(Object(BigInt('-42')), { version })).toBe('-42\n')
      })
      test('BigInt with HEX format', () => {
        const doc = new YAML.Document<YAML.Scalar, false>(BigInt('42'), {
          version
        })
        doc.contents.format = 'HEX'
        expect(String(doc)).toBe('0x2a\n')
      })
      test('BigInt with OCT format', () => {
        const doc = new YAML.Document<YAML.Scalar, false>(BigInt('42'), {
          version
        })
        doc.contents.format = 'OCT'
        const exp = version === '1.2' ? '0o52\n' : '052\n'
        expect(String(doc)).toBe(exp)
      })
      test('negative BigInt with OCT format', () => {
        const doc = new YAML.Document<YAML.Scalar, false>(BigInt('-42'), {
          version
        })
        doc.contents.format = 'OCT'
        const exp = version === '1.2' ? '-42\n' : '-052\n'
        expect(String(doc)).toBe(exp)
      })
    })

    describe('string', () => {
      const opt = { lineWidth: 20, minContentWidth: 0, version }

      test('plain', () => {
        expect(YAML.stringify('STR', opt)).toBe('STR\n')
      })
      test('double-quoted', () => {
        expect(YAML.stringify('"x"', opt)).toBe('\'"x"\'\n')
      })
      test('single-quoted', () => {
        expect(YAML.stringify("'x'", opt)).toBe('"\'x\'"\n')
      })
      test('escaped', () => {
        expect(YAML.stringify('null: \u0000', opt)).toBe('"null: \\0"\n')
      })
      test('short multiline', () => {
        expect(YAML.stringify('blah\nblah\nblah', opt)).toBe(
          '|-\nblah\nblah\nblah\n'
        )
      })
      test('long multiline', () => {
        expect(
          YAML.stringify(
            'blah blah\nblah blah blah blah blah blah blah blah blah blah\n',
            opt
          )
        ).toBe(`>
blah blah

blah blah blah blah
blah blah blah blah
blah blah\n`)
      })
      test('String', () => {
        expect(YAML.stringify(new String('STR'), opt)).toBe('STR\n')
      })

      test('long line in map', () => {
        const foo = 'fuzz'.repeat(16)
        const doc = new YAML.Document<
          YAML.YAMLMap<YAML.Scalar, YAML.Scalar>,
          false
        >({ foo }, { version })
        for (const node of doc.contents.items)
          node.value!.type = Scalar.QUOTE_DOUBLE
        expect(
          doc
            .toString(opt)
            .split('\n')
            .map(line => line.length)
        ).toMatchObject([20, 20, 20, 20, 0])
      })

      test('long line in sequence', () => {
        const foo = 'fuzz'.repeat(16)
        const doc = new YAML.Document<YAML.YAMLSeq<YAML.Scalar>, false>([foo], {
          version
        })
        for (const node of doc.contents.items) node.type = Scalar.QUOTE_DOUBLE
        expect(
          doc
            .toString(opt)
            .split('\n')
            .map(line => line.length)
        ).toMatchObject([20, 20, 20, 17, 0])
      })

      test('long line in sequence in map', () => {
        const foo = 'fuzz'.repeat(16)
        const doc = new YAML.Document<
          YAML.YAMLMap<YAML.Scalar, YAML.YAMLSeq<YAML.Scalar>>,
          false
        >({ foo: [foo] }, { version })
        const seq = doc.contents.items[0].value!
        for (const node of seq.items) node.type = Scalar.QUOTE_DOUBLE
        expect(
          doc
            .toString(opt)
            .split('\n')
            .map(line => line.length)
        ).toMatchObject([4, 20, 20, 20, 20, 10, 0])
      })
    })
  })
}

describe('timestamp-like string (YAML 1.1)', () => {
  for (const [name, str] of [
    ['canonical', '2001-12-15T02:59:43.1Z'],
    ['validIso8601', '2001-12-14t21:59:43.10-05:00'],
    ['spaceSeparated', '2001-12-14 21:59:43.10 -5'],
    ['noTimeZone', '2001-12-15 2:59:43.10']
  ]) {
    test(name, () => {
      const res = YAML.stringify(str, { version: '1.1' })
      expect(res).toBe(`"${str}"\n`)
      expect(YAML.parse(res, { version: '1.1' })).toBe(str)
    })
  }
})

// https://github.com/tc39/proposal-well-formed-stringify
describe('unpaired surrogate pairs of Unicode code points', () => {
  test('𝌆', () => {
    expect(YAML.stringify('𝌆')).toBe('𝌆\n')
  })
  test('\uD834\uDF06', () => {
    expect(YAML.stringify('\uD834\uDF06')).toBe('𝌆\n')
  })
  test('😀', () => {
    expect(YAML.stringify('😀')).toBe('😀\n')
  })
  test('\uD83D\uDE00', () => {
    expect(YAML.stringify('\uD83D\uDE00')).toBe('😀\n')
  })
  test('\uDF06\uD834', () => {
    expect(YAML.stringify('\uDF06\uD834')).toBe('"\\udf06\\ud834"\n')
  })
  test('\uDEAD', () => {
    expect(YAML.stringify('\uDEAD')).toBe('"\\udead"\n')
  })
})

describe('circular references', () => {
  test('parent at root', () => {
    const map: any = { foo: 'bar' }
    map.map = map
    expect(YAML.stringify(map)).toBe(`&a1
foo: bar
map: *a1\n`)
  })

  test('ancestor at root', () => {
    const baz: any = {}
    const map = { foo: { bar: { baz } } }
    baz.map = map
    expect(YAML.stringify(map)).toBe(`&a1
foo:
  bar:
    baz:
      map: *a1\n`)
  })

  test('sibling sequences', () => {
    const one = ['one']
    const two = ['two']
    const seq = [one, two, one, one, two]
    expect(YAML.stringify(seq)).toBe(`- &a1
  - one
- &a2
  - two
- *a1
- *a1
- *a2\n`)
  })

  test('further relatives', () => {
    const baz = { a: 1 }
    const seq = [{ foo: { bar: { baz } } }, { fe: { fi: { fo: { baz } } } }]
    expect(YAML.stringify(seq)).toBe(`- foo:
    bar:
      baz: &a1
        a: 1
- fe:
    fi:
      fo:
        baz: *a1\n`)
  })

  test('only match objects', () => {
    const date = new Date('2001-12-15T02:59:43.1Z')
    const seq = ['a', 'a', 1, 1, true, true, date, date]
    expect(YAML.stringify(seq, { anchorPrefix: 'foo', version: '1.1' }))
      .toBe(`- a
- a
- 1
- 1
- true
- true
- &foo1 2001-12-15T02:59:43.100Z
- *foo1\n`)
  })

  test('do not match nulls', () => {
    const set = { a: null, b: null }
    expect(YAML.stringify(set)).toBe('a: null\nb: null\n')
  })
})

test('array', () => {
  const array = [3, ['four', 5]]
  const str = YAML.stringify(array)
  expect(str).toBe(
    `- 3
- - four
  - 5\n`
  )
})

describe('maps', () => {
  test('JS Object', () => {
    const object = { x: 3, y: [4], z: { w: 'five', v: 6 } }
    const str = YAML.stringify(object)
    expect(str).toBe(
      `x: 3
y:
  - 4
z:
  w: five
  v: 6\n`
    )
  })

  test('Map with non-Pair item', () => {
    const doc = new YAML.Document<YAML.YAMLMap, false>({ x: 3, y: 4 })
    expect(String(doc)).toBe('x: 3\ny: 4\n')
    // @ts-expect-error This should fail.
    doc.contents.items.push('TEST')
    expect(() => String(doc)).toThrow(/^Map items must all be pairs.*TEST/)
  })

  test('Keep block scalar types for keys', () => {
    const doc = YAML.parseDocument('? >+ #comment\n foo\n\n: bar')
    expect(String(doc)).toBe('? >+ #comment\n  foo\n\n: bar\n')
  })

  test('Document as key', () => {
    const doc = new YAML.Document({ a: 1 })
    doc.add(new YAML.Document({ b: 2, c: 3 }))
    expect(String(doc)).toBe('a: 1\n? b: 2\n  c: 3\n')
  })

  test('plain key containing flow indicators', () => {
    const doc = YAML.parseDocument('foo[{}]: bar')
    expect(doc.toString()).toBe('foo[{}]: bar\n')
  })

  describe('No extra whitespace for empty values', () => {
    const getDoc = () =>
      new YAML.Document<YAML.YAMLMap<YAML.Scalar, YAML.Scalar>, false>({
        a: null,
        b: null
      })

    test('Block map, no comments', () => {
      expect(getDoc().toString({ nullStr: '' })).toBe('a:\nb:\n')
    })

    test('Block map, with key.comment', () => {
      const doc = getDoc()
      doc.contents.items[0].key.comment = 'c'
      expect(doc.toString({ nullStr: '' })).toBe('a: #c\nb:\n')
    })

    test('Block map, with value.commentBefore', () => {
      const doc = getDoc()
      doc.get('a', true).commentBefore = 'c'
      expect(doc.toString({ nullStr: '' })).toBe('a:\n  #c\nb:\n')
    })

    test('Flow map, no comments', () => {
      const doc = getDoc()
      doc.contents.flow = true
      expect(doc.toString({ nullStr: '' })).toBe('{ a:, b: }\n')
    })

    test('Flow map, with key.comment', () => {
      const doc = getDoc()
      doc.contents.flow = true
      doc.contents.items[0].key.comment = 'c'
      expect(doc.toString({ nullStr: '' })).toBe('{\n  a: #c\n    ,\n  b:\n}\n')
    })

    test('Flow map, with value.commentBefore', () => {
      const doc = getDoc()
      doc.contents.flow = true
      doc.get('a', true).commentBefore = 'c'
      expect(doc.toString({ nullStr: '' })).toBe(
        '{\n  a:\n    #c\n    ,\n  b:\n}\n'
      )
    })
  })

  describe('properties on collections in block mapping', () => {
    test('explicit tag on block sequence', () => {
      const src = source`
        key: !tag
          - one
          - two
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(src)
    })
    test('explicit tag on block mapping', () => {
      const src = source`
        key: !tag
          one: 1
          two: 2
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(src)
    })
    test('single-line comment on block sequence', () => {
      const src = source`
        key: #comment
          - one
          - two
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(source`
        key:
          #comment
          - one
          - two
      `)
    })
    test('single-line comment and explicit tag on block sequence', () => {
      const src = source`
        key: #comment
          !tag
          - one
          - two
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(source`
        key:
          #comment
          !tag
          - one
          - two
      `)
    })
    test('explicit tag and comment on block sequence', () => {
      const src = source`
        key: !tag
          #comment
          - one
          - two
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(source`
        key:
          #comment
          !tag
          - one
          - two
      `)
    })
    test('anchor on block sequence', () => {
      const src = source`
        key: &anchor
          - one
          - two
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(src)
    })
    test('anchor and explicit tag on block sequence', () => {
      const src = source`
        key: &anchor !tag
          - one
          - two
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(src)
    })
    test('explicit tag on empty mapping', () => {
      const doc = new YAML.Document<YAML.Node, false>({ key: {} })
      doc.get('key').tag = '!tag'
      expect(String(doc)).toBe(source`
        key: !tag {}
      `)
    })
    test('explicit tag on single-line flow mapping', () => {
      const src = source`
        key: !tag { one: 1, two: 2 }
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(src)
    })
    test('explicit tag on multi-line flow mapping', () => {
      const src = source`
        key: !tag {
          one: aaaaaaaaaa,
          two: bbbbbbbbbb,
          three: cccccccccc,
          four: dddddddddd,
          five: eeeeeeeeee
        }
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(source`
        key:
          !tag {
            one: aaaaaaaaaa,
            two: bbbbbbbbbb,
            three: cccccccccc,
            four: dddddddddd,
            five: eeeeeeeeee
          }
      `)
    })
    test('explicit tag on explicit-value block sequence', () => {
      const src = source`
        ? [ key ]
        : !tag
          - one
          - two
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(src)
    })
  })
})

test('eemeli/yaml#43: Quoting colons', () => {
  const doc = new YAML.Document({ key: ':' })
  const str = String(doc)
  expect(() => YAML.parse(str)).not.toThrow()
  expect(str).toBe('key: ":"\n')
})

test('eemeli/yaml#52: Quoting item markers', () => {
  const doc = new YAML.Document({ key: '-' })
  const str = String(doc)
  expect(() => YAML.parse(str)).not.toThrow()
  expect(str).toBe('key: "-"\n')
  doc.contents = doc.createNode({ key: '?' })
  const str2 = String(doc)
  expect(() => YAML.parse(str2)).not.toThrow()
  expect(str2).toBe('key: "?"\n')
})

test('reserved names', () => {
  const str = YAML.stringify({ comment: 'foo' })
  expect(str).toBe('comment: foo\n')
})

describe('eemeli/yaml#85', () => {
  test('reported', () => {
    const str = `testArray: []\ntestObject: {}\ntestArray2: [ "hello" ]\n`
    const doc = YAML.parseDocument(str)
    expect(String(doc)).toBe(str)
  })

  test('multiline flow collection', () => {
    const str = `foo: [ bar, bar, bar, bar, bar, bar, bar, bar, bar, bar, bar, bar, bar, bar, bar, bar, bar, bar ]`
    const doc = YAML.parseDocument(str)
    const str2 = String(doc)
    expect(str2).toMatch(/^foo:\n {2}\[\n {4}bar/)
    expect(YAML.parse(str2)).toMatchObject(doc.toJS())
  })
})

test('eemeli/yaml#87', () => {
  const doc = YAML.parseDocument('test: x')
  doc.set('test', { a: 'test' })
  expect(String(doc)).toBe('test:\n  a: test\n')
})

describe('Custom null/bool string representations', () => {
  test('tilde null', () => {
    const doc = YAML.parse('a: null')
    const str = YAML.stringify(doc, { nullStr: '~', simpleKeys: true })
    expect(str).toBe('a: ~\n')
    expect(YAML.parse(str)).toEqual({ a: null })
  })

  test('empty string null', () => {
    const doc = YAML.parse('a: null')
    const str = YAML.stringify(doc, { nullStr: '', simpleKeys: true })
    expect(str).toBe('a:\n')
    expect(YAML.parse(str)).toEqual({ a: null })
  })

  test('empty string camelBool', () => {
    const doc = YAML.parse('[true, false]')
    const str = YAML.stringify(doc, { trueStr: 'True', falseStr: 'False' })
    expect(str).toBe('- True\n- False\n')
    expect(YAML.parse(str)).toEqual([true, false])
  })

  test('empty string upperBool', () => {
    const doc = YAML.parse('[true, false]')
    const str = YAML.stringify(doc, { trueStr: 'TRUE', falseStr: 'FALSE' })
    expect(str).toBe('- TRUE\n- FALSE\n')
    expect(YAML.parse(str)).toEqual([true, false])
  })
})

describe('scalar styles', () => {
  test('null Scalar styles', () => {
    const doc = YAML.parseDocument('[ null, Null, NULL, ~ ]')
    expect(String(doc)).toBe('[ null, Null, NULL, ~ ]\n')
  })

  test('bool Scalar styles on core', () => {
    const doc = YAML.parseDocument(
      '[ true, false, True, False, TRUE, FALSE, on, off, y, n ]'
    )
    const str = `[
  true,
  false,
  True,
  False,
  TRUE,
  FALSE,
  on,
  off,
  y,
  n
]\n`
    expect(String(doc)).toBe(str)
    expect(YAML.parse(str)).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
      'on',
      'off',
      'y',
      'n'
    ])
  })

  test('bool Scalar styles on YAML1.1', () => {
    const doc = YAML.parseDocument(
      '[ n, N, NO, no, No, False, false, FALSE, Off, off, OFF, y, Y, Yes, yes, YES, true, True, TRUE, ON, on, On ]',
      { schema: 'yaml-1.1' }
    )
    const str = `[
  n,
  N,
  NO,
  no,
  No,
  False,
  false,
  FALSE,
  Off,
  off,
  OFF,
  y,
  Y,
  Yes,
  yes,
  YES,
  true,
  True,
  TRUE,
  ON,
  on,
  On
]\n`
    expect(String(doc)).toBe(str)
    expect(YAML.parse(str, { schema: 'yaml-1.1' })).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ])
  })
})

describe('simple keys', () => {
  test('key with no value', () => {
    const doc = YAML.parseDocument('? ~')
    expect(doc.toString()).toBe('? ~\n')
    expect(doc.toString({ simpleKeys: true })).toBe('~: null\n')
  })

  test('key with block scalar value', () => {
    const doc = YAML.parseDocument<any>('foo: bar')
    doc.contents.items[0].key.type = 'BLOCK_LITERAL'
    expect(doc.toString()).toBe('? |-\n  foo\n: bar\n')
    expect(doc.toString({ simpleKeys: true })).toBe('"foo": bar\n')
  })

  test('key with comment', () => {
    const doc = YAML.parseDocument<any>('foo: bar')
    doc.contents.items[0].key.comment = 'FOO'
    expect(doc.toString()).toBe('foo: #FOO\n  bar\n')
    expect(() => doc.toString({ simpleKeys: true })).toThrow(
      /With simple keys, key nodes cannot have comments/
    )
  })

  test('key with collection value', () => {
    const doc = YAML.parseDocument('[foo]: bar')
    expect(doc.toString()).toBe('? [ foo ]\n: bar\n')
    expect(() => doc.toString({ simpleKeys: true })).toThrow(
      /With simple keys, collection cannot be used as a key value/
    )
  })

  test('key value lingth > 1024', () => {
    const str = `
    ? ${new Array(1026).join('a')}
    : longkey`
    const doc = YAML.parseDocument(str)
    expect(doc.toString()).toBe(`? ${new Array(1026).join('a')}\n: longkey\n`)
    expect(() => doc.toString({ simpleKeys: true })).toThrow(
      /With simple keys, single line scalar must not span more than 1024 characters/
    )
  })
})

test('eemeli/yaml#128: YAML node inside object', () => {
  const doc = new YAML.Document()
  const seq = doc.createNode(['a'])
  seq.commentBefore = 'sc'
  const map = doc.createNode({ foo: 'bar', seq })
  map.commentBefore = 'mc'
  const obj = { array: [1], map }
  expect(YAML.stringify(obj)).toBe(source`
    array:
      - 1
    map:
      #mc
      foo: bar
      seq:
        #sc
        - a
  `)
})

describe('sortMapEntries', () => {
  const obj = { b: 2, a: 1, c: 3 }
  test('sortMapEntries: undefined', () => {
    expect(YAML.stringify(obj)).toBe('b: 2\na: 1\nc: 3\n')
  })
  test('sortMapEntries: true', () => {
    expect(YAML.stringify(obj, { sortMapEntries: true })).toBe(
      'a: 1\nb: 2\nc: 3\n'
    )
  })
  test('sortMapEntries: function', () => {
    const sortMapEntries = (a: any, b: any) =>
      a.key < b.key ? 1 : a.key > b.key ? -1 : 0
    expect(YAML.stringify(obj, { sortMapEntries })).toBe('c: 3\nb: 2\na: 1\n')
  })
  test('doc.add', () => {
    const doc = new YAML.Document(obj, { sortMapEntries: true })
    doc.add(new Pair('bb', 4))
    expect(String(doc)).toBe('a: 1\nb: 2\nbb: 4\nc: 3\n')
  })
  test('doc.set', () => {
    const doc = new YAML.Document(obj, { sortMapEntries: true })
    doc.set('bb', 4)
    expect(String(doc)).toBe('a: 1\nb: 2\nbb: 4\nc: 3\n')
  })
})

describe('custom indent', () => {
  let obj: unknown
  beforeEach(() => {
    const doc = new YAML.Document()
    const seq = doc.createNode(['a'])
    seq.commentBefore = 'sc'
    const map = doc.createNode({ foo: 'bar', seq })
    map.commentBefore = 'mc'
    obj = { array: [{ a: 1, b: 2 }], map }
  })

  test('indent: 0', () => {
    expect(() => YAML.stringify(obj, { indent: 0 })).toThrow(
      /must be a positive integer/
    )
  })

  test('indent: 1', () => {
    expect(YAML.stringify(obj, { indent: 1 })).toBe(source`
      array:
       - a: 1
         b: 2
      map:
       #mc
       foo: bar
       seq:
        #sc
        - a
    `)
  })

  test('indent: 4', () => {
    expect(YAML.stringify(obj, { indent: 4 })).toBe(source`
      array:
          - a: 1
            b: 2
      map:
          #mc
          foo: bar
          seq:
              #sc
              - a
    `)
  })
})

describe('indentSeq: false', () => {
  let obj: unknown
  beforeEach(() => {
    const seq = new YAML.Document().createNode(['a'])
    seq.commentBefore = 'sc'
    obj = { array: [{ a: 1, b: 2 }], map: { seq } }
  })

  test('indent: 1', () => {
    expect(YAML.stringify(obj, { indent: 1, indentSeq: false })).toBe(source`
      array:
       - a: 1
         b: 2
      map:
       seq:
        #sc
        - a
    `)
  })

  test('indent: 2', () => {
    expect(YAML.stringify(obj, { indent: 2, indentSeq: false })).toBe(source`
      array:
      - a: 1
        b: 2
      map:
        seq:
        #sc
        - a
    `)
  })

  test('indent: 4', () => {
    expect(YAML.stringify(obj, { indent: 4, indentSeq: false })).toBe(source`
      array:
        - a: 1
          b: 2
      map:
          seq:
            #sc
            - a
    `)
  })
})

describe('collectionStyle', () => {
  test('collectionStyle: undefined', () => {
    const doc = new YAML.Document<YAML.YAMLMap, false>({ foo: ['bar'] })
    expect(doc.toString()).toBe('foo:\n  - bar\n')

    doc.contents.flow = false
    doc.get('foo').flow = true
    expect(doc.toString()).toBe('foo: [ bar ]\n')

    doc.contents.flow = true
    doc.get('foo').flow = false
    expect(doc.toString()).toBe('{ foo: [ bar ] }\n')
  })

  test("collectionStyle: 'any'", () => {
    const doc = new YAML.Document<YAML.YAMLMap, false>({ foo: ['bar'] })
    expect(doc.toString({ collectionStyle: 'any' })).toBe('foo:\n  - bar\n')

    doc.contents.flow = false
    doc.get('foo').flow = true
    expect(doc.toString({ collectionStyle: 'any' })).toBe('foo: [ bar ]\n')

    doc.contents.flow = true
    doc.get('foo').flow = false
    expect(doc.toString({ collectionStyle: 'any' })).toBe('{ foo: [ bar ] }\n')
  })

  test("collectionStyle: 'block'", () => {
    const doc = new YAML.Document<YAML.YAMLMap, false>({ foo: ['bar'] })
    expect(doc.toString({ collectionStyle: 'block' })).toBe('foo:\n  - bar\n')

    doc.contents.flow = false
    doc.get('foo').flow = true
    expect(doc.toString({ collectionStyle: 'block' })).toBe('foo:\n  - bar\n')

    doc.contents.flow = true
    doc.get('foo').flow = false
    expect(doc.toString({ collectionStyle: 'block' })).toBe('foo:\n  - bar\n')
  })

  test("collectionStyle: 'flow'", () => {
    const doc = new YAML.Document<YAML.YAMLMap, false>({ foo: ['bar'] })
    expect(doc.toString({ collectionStyle: 'flow' })).toBe('{ foo: [ bar ] }\n')

    doc.get('foo').flow = true
    expect(doc.toString({ collectionStyle: 'flow' })).toBe('{ foo: [ bar ] }\n')

    doc.contents.flow = true
    doc.get('foo').flow = false
    expect(doc.toString({ collectionStyle: 'flow' })).toBe('{ foo: [ bar ] }\n')
  })
})

describe('Scalar options', () => {
  describe('defaultStringType & defaultKeyType', () => {
    test('PLAIN, PLAIN', () => {
      const opt = {
        defaultStringType: Scalar.PLAIN,
        defaultKeyType: Scalar.PLAIN
      } as const
      expect(YAML.stringify({ foo: 'bar' }, opt)).toBe('foo: bar\n')
    })

    test('BLOCK_FOLDED, BLOCK_FOLDED', () => {
      const opt = {
        defaultStringType: Scalar.BLOCK_FOLDED,
        defaultKeyType: Scalar.BLOCK_FOLDED
      } as const
      expect(YAML.stringify({ foo: 'bar' }, opt)).toBe('"foo": |-\n  bar\n')
    })

    test('QUOTE_DOUBLE, PLAIN', () => {
      const opt = {
        defaultStringType: Scalar.QUOTE_DOUBLE,
        defaultKeyType: Scalar.PLAIN
      } as const
      expect(YAML.stringify({ foo: 'bar' }, opt)).toBe('foo: "bar"\n')
    })

    test('QUOTE_DOUBLE, QUOTE_SINGLE', () => {
      const opt = {
        defaultStringType: Scalar.QUOTE_DOUBLE,
        defaultKeyType: Scalar.QUOTE_SINGLE
      } as const
      expect(YAML.stringify({ foo: 'bar' }, opt)).toBe('\'foo\': "bar"\n')
    })

    test('QUOTE_DOUBLE, null', () => {
      const opt = {
        defaultStringType: Scalar.QUOTE_DOUBLE,
        defaultKeyType: null
      } as const
      expect(YAML.stringify({ foo: 'bar' }, opt)).toBe('"foo": "bar"\n')
    })

    test('Use defaultType for explicit keys', () => {
      const opt = {
        defaultStringType: Scalar.QUOTE_DOUBLE,
        defaultKeyType: Scalar.QUOTE_SINGLE
      } as const
      const doc = new YAML.Document<YAML.YAMLMap, false>({ foo: null })
      doc.contents.items[0].value = null
      expect(doc.toString(opt)).toBe('? "foo"\n')
    })
  })

  for (const { singleQuote, numeric, upgrade, parsed } of [
    {
      singleQuote: null,
      numeric: '"123"\n',
      upgrade: '"foo #bar"\n',
      parsed: "'foo'\n"
    },
    {
      singleQuote: false,
      numeric: '"123"\n',
      upgrade: '"foo #bar"\n',
      parsed: '"foo"\n'
    },
    {
      singleQuote: true,
      numeric: "'123'\n",
      upgrade: "'foo #bar'\n",
      parsed: "'foo'\n"
    }
  ]) {
    describe(`singleQuote: ${singleQuote}`, () => {
      const opt = { singleQuote }

      test('plain', () => {
        expect(YAML.stringify('foo bar', opt)).toBe('foo bar\n')
      })

      test('contains double-quote', () => {
        expect(YAML.stringify('foo: "bar"', opt)).toBe(
          singleQuote === false ? `"foo: \\"bar\\""\n` : `'foo: "bar"'\n`
        )
      })

      test('contains single-quote', () => {
        expect(YAML.stringify("foo: 'bar'", opt)).toBe(`"foo: 'bar'"\n`)
      })

      test('numerical string', () => {
        expect(YAML.stringify('123', opt)).toBe(numeric)
      })

      test('upgrade from plain', () => {
        expect(YAML.stringify('foo #bar', opt)).toBe(upgrade)
      })

      test('parsed node', () => {
        const doc = YAML.parseDocument("'foo'")
        expect(doc.toString(opt)).toBe(parsed)
      })
    })
  }

  for (const { blockQuote, marker, value, parsed } of [
    {
      blockQuote: false,
      marker: '"---"\n',
      value: 'foo: "bar\\nfuzz\\n"\n',
      parsed: '"foo\\n"\n'
    },
    {
      blockQuote: true,
      marker: '|-\n  ---\n',
      value: 'foo: |\n  bar\n  fuzz\n',
      parsed: '>\nfoo\n'
    },
    {
      blockQuote: 'literal',
      marker: '|-\n  ---\n',
      value: 'foo: |\n  bar\n  fuzz\n',
      parsed: '|\nfoo\n'
    },
    {
      blockQuote: 'folded',
      marker: '>-\n  ---\n',
      value: 'foo: >\n  bar\n\n  fuzz\n',
      parsed: '>\nfoo\n'
    }
  ] as const) {
    describe(`blockQuote: ${blockQuote}`, () => {
      test('doc-marker', () => {
        expect(YAML.stringify('---', { blockQuote })).toBe(marker)
      })

      test('map with value', () => {
        expect(YAML.stringify({ foo: 'bar\nfuzz\n' }, { blockQuote })).toBe(
          value
        )
      })

      test('override parsed type', () => {
        const doc = YAML.parseDocument('>\n  foo\n')
        expect(doc.toString({ blockQuote })).toBe(parsed)
      })
    })
  }
})

describe('toStringDefaults', () => {
  test('Set on Document creation', () => {
    const doc = new YAML.Document(
      { foo: null },
      { toStringDefaults: { nullStr: '~' } }
    )
    expect(doc.toString()).toBe('foo: ~\n')
  })

  test('Override in toString()', () => {
    const doc = new YAML.Document(
      { foo: null },
      { toStringDefaults: { nullStr: '~' } }
    )
    expect(doc.toString({ nullStr: '' })).toBe('foo:\n')
  })
})

describe('Document markers in top-level scalars', () => {
  test('---', () => {
    const str = YAML.stringify('---')
    expect(str).toBe('|-\n  ---\n')
    expect(YAML.parse(str)).toBe('---')
  })

  test('...', () => {
    const str = YAML.stringify('...')
    expect(str).toBe('|-\n  ...\n')
    expect(YAML.parse(str)).toBe('...')
  })

  test('foo\\n...\\n', () => {
    const str = YAML.stringify('foo\n...\n')
    expect(str).toBe('|\n  foo\n  ...\n')
    expect(YAML.parse(str)).toBe('foo\n...\n')
  })

  test("'foo\\n...'", () => {
    const doc = new YAML.Document<YAML.Scalar, false>('foo\n...')
    doc.contents.type = Scalar.QUOTE_SINGLE
    const str = String(doc)
    expect(str).toBe("'foo\n\n  ...'\n")
    expect(YAML.parse(str)).toBe('foo\n...')
  })

  test('"foo\\n..."', () => {
    const doc = new YAML.Document<YAML.Scalar, false>('foo\n...')
    doc.contents.type = Scalar.QUOTE_DOUBLE
    const str = doc.toString({ doubleQuotedMinMultiLineLength: 0 })
    expect(str).toBe('"foo\n\n  ..."\n')
    expect(YAML.parse(str)).toBe('foo\n...')
  })

  test('foo\\n%bar\\n', () => {
    const str = YAML.stringify('foo\n%bar\n')
    expect(str).toBe('|\n  foo\n  %bar\n')
    expect(YAML.parse(str)).toBe('foo\n%bar\n')
  })

  test('use marker line for block scalar header', () => {
    const doc = YAML.parseDocument('|\nfoo\n')
    expect(doc.toString({ directives: true })).toBe('--- |\nfoo\n')
  })
})

describe('Document markers in top-level map keys (eemeli/yaml#431)', () => {
  test('---', () => {
    const str = YAML.stringify({ '--- x': 42 })
    expect(str).toBe('"--- x": 42\n')
    expect(YAML.parse(str)).toEqual({ '--- x': 42 })
  })

  test('...', () => {
    const str = YAML.stringify({ '... x': 42 })
    expect(str).toBe('"... x": 42\n')
    expect(YAML.parse(str)).toEqual({ '... x': 42 })
  })
})

describe('undefined values', () => {
  test('undefined', () => {
    expect(YAML.stringify(undefined)).toBeUndefined()
  })

  test('[1, undefined, 2]', () => {
    expect(YAML.stringify([1, undefined, 2])).toBe('- 1\n- null\n- 2\n')
  })

  test("{ a: 'A', b: undefined, c: 'C' }", () => {
    expect(YAML.stringify({ a: 'A', b: undefined, c: 'C' })).toBe(
      'a: A\nc: C\n' // note: No `b` key
    )
  })

  test("{ a: 'A', b: null, c: 'C' }", () => {
    expect(YAML.stringify({ a: 'A', b: null, c: 'C' })).toBe(
      'a: A\nb: null\nc: C\n'
    )
  })

  test("{ a: 'A', b: Scalar(undefined), c: 'C' }", () => {
    const obj = { a: 'A', b: new Scalar(undefined), c: 'C' }
    expect(YAML.stringify(obj)).toBe('a: A\nb: null\nc: C\n')
  })

  test("Map { 'a' => 'A', 'b' => undefined, 'c' => 'C' }", () => {
    const map = new Map([
      ['a', 'A'],
      ['b', undefined],
      ['c', 'C']
    ])
    expect(YAML.stringify(map)).toBe('a: A\nc: C\n')
  })

  describe('keepUndefined: true', () => {
    test('undefined', () => {
      expect(YAML.stringify(undefined, { keepUndefined: true })).toBe('null\n')
    })

    test("{ a: 'A', b: undefined, c: 'C' }", () => {
      expect(
        YAML.stringify(
          { a: 'A', b: undefined, c: 'C' },
          { keepUndefined: true }
        )
      ).toBe('a: A\nb: null\nc: C\n')
    })
  })
})

describe('replacer', () => {
  test('empty array', () => {
    const arr = [
      { a: 1, b: 2 },
      { a: 4, b: 5 }
    ]
    expect(YAML.stringify(arr, [])).toBe('- {}\n- {}\n')
  })

  test('Object, array of string', () => {
    const arr = [
      { a: 1, b: 2 },
      { a: 4, b: 5 }
    ]
    expect(YAML.stringify(arr, ['a'])).toBe('- a: 1\n- a: 4\n')
  })

  test('Map, array of string', () => {
    const map = new Map<unknown, unknown>([
      ['a', 1],
      ['b', 2],
      [3, 4]
    ])
    expect(YAML.stringify(map, ['a', '3'])).toBe('a: 1\n')
  })

  test('Object, array of number', () => {
    const obj = { a: 1, b: 2, 3: 4, 5: 6 }
    expect(YAML.stringify(obj, [3, 5])).toBe('"3": 4\n"5": 6\n')
  })

  test('Map, array of number', () => {
    const map = new Map<unknown, unknown>([
      ['a', 1],
      ['3', 2],
      [3, 4]
    ])
    expect(YAML.stringify(map, [3])).toBe('"3": 2\n3: 4\n')
  })

  test('function as logger', () => {
    const spy = jest.fn((_key, value) => value)
    const obj = { 1: 1, b: 2, c: [4] }
    YAML.stringify(obj, spy)
    expect(spy.mock.calls).toMatchObject([
      ['', obj],
      ['1', 1],
      ['b', 2],
      ['c', [4]],
      ['0', 4]
    ])
    expect(spy.mock.instances).toMatchObject([
      { '': obj },
      obj,
      obj,
      obj,
      obj.c
    ])
  })

  test('function as filter of Object entries', () => {
    const obj = { 1: 1, b: 2, c: [4] }
    const fn = (_key: unknown, value: unknown) =>
      typeof value === 'number' ? undefined : value
    expect(YAML.stringify(obj, fn)).toBe('c:\n  - null\n')
  })

  test('function as filter of Map entries', () => {
    const map = new Map<unknown, unknown>([
      [1, 1],
      ['b', 2],
      ['c', [4]]
    ])
    const fn = (_key: unknown, value: unknown) =>
      typeof value === 'number' ? undefined : value
    expect(YAML.stringify(map, fn)).toBe('c:\n  - null\n')
  })

  test('function as transformer', () => {
    const obj = { a: 1, b: 2, c: [3, 4] }
    const fn = (_key: unknown, value: unknown) =>
      typeof value === 'number' ? 2 * value : value
    expect(YAML.stringify(obj, fn)).toBe('a: 2\nb: 4\nc:\n  - 6\n  - 8\n')
  })

  test('createNode, !!set', () => {
    const replacer = jest.fn((_key, value) => value)
    const doc = new YAML.Document(null, { customTags: ['set'] })
    const set = new Set(['a', 'b', 1, [2]])
    doc.createNode(set, replacer)
    expect(replacer.mock.calls).toMatchObject([
      ['', set],
      ['a', 'a'],
      ['b', 'b'],
      [1, 1],
      [[2], [2]],
      ['0', 2]
    ])
    expect(replacer.mock.instances).toMatchObject([
      { '': set },
      set,
      set,
      set,
      set,
      [2]
    ])
  })

  test('createNode, !!omap', () => {
    const replacer = jest.fn((_key, value) => value)
    const doc = new YAML.Document(null, { customTags: ['omap'] })
    const omap = [
      ['a', 1],
      [1, 'a']
    ]
    doc.createNode(omap, replacer, { tag: '!!omap' })
    expect(replacer.mock.calls).toMatchObject([
      ['', omap],
      ['0', omap[0]],
      ['1', omap[1]]
    ])
    expect(replacer.mock.instances).toMatchObject([{ '': omap }, omap, omap])
  })
})

describe('YAML.stringify options as scalar', () => {
  test('number', () => {
    expect(YAML.stringify({ foo: 'bar\nfuzz' }, null, 1)).toBe(
      'foo: |-\n bar\n fuzz\n'
    )
  })
  test('string', () => {
    expect(YAML.stringify({ foo: 'bar\nfuzz' }, null, '123')).toBe(
      'foo: |-\n   bar\n   fuzz\n'
    )
  })
})

describe('YAML.stringify on ast Document', () => {
  test('null document', () => {
    const doc = YAML.parseDocument('null')
    expect(YAML.stringify(doc)).toBe('null\n')
  })
})

describe('flow collection padding', () => {
  const doc = new YAML.Document()
  doc.contents = new YAML.YAMLSeq()
  doc.contents.items = [1, 2]
  doc.contents.flow = true

  test('default', () => {
    expect(doc.toString()).toBe('[ 1, 2 ]\n')
  })
  test('default', () => {
    expect(doc.toString({ flowCollectionPadding: false })).toBe('[1, 2]\n')
  })
})
