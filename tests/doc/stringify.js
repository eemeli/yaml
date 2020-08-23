/* global BigInt */

import { source } from 'common-tags'
import YAML from '../../index.js'
import { Pair, Scalar } from '../../types.js'
import { Type, stringifyString } from '../../util.js'

for (const [name, version] of [
  ['YAML 1.1', '1.1'],
  ['YAML 1.2', '1.2']
]) {
  describe(name, () => {
    let origVersion
    beforeAll(() => {
      origVersion = YAML.defaultOptions.version
      YAML.defaultOptions.version = version
    })
    afterAll(() => {
      YAML.defaultOptions.version = origVersion
    })

    test('undefined', () => {
      expect(YAML.stringify()).toBe('\n')
    })

    test('null', () => {
      expect(YAML.stringify(null)).toBe('null\n')
    })

    describe('boolean', () => {
      test('true', () => {
        expect(YAML.stringify(true)).toBe('true\n')
      })
      test('false', () => {
        expect(YAML.stringify(false)).toBe('false\n')
      })
    })

    describe('number', () => {
      test('integer', () => {
        expect(YAML.stringify(3)).toBe('3\n')
      })
      test('float', () => {
        expect(YAML.stringify(3.141)).toBe('3.141\n')
      })
      test('zero', () => {
        expect(YAML.stringify(0)).toBe('0\n')
      })
      test('NaN', () => {
        expect(YAML.stringify(NaN)).toBe('.nan\n')
      })

      test('float with trailing zeros', () => {
        const doc = new YAML.Document(3)
        doc.contents.minFractionDigits = 2
        expect(String(doc)).toBe('3.00\n')
      })
      test('scientific float ignores minFractionDigits', () => {
        const doc = new YAML.Document(3)
        doc.contents.format = 'EXP'
        doc.contents.minFractionDigits = 2
        expect(String(doc)).toBe('3e+0\n')
      })

      test('integer with HEX format', () => {
        const doc = new YAML.Document(42)
        doc.contents.format = 'HEX'
        expect(String(doc)).toBe('0x2a\n')
      })
      test('float with HEX format', () => {
        const doc = new YAML.Document(4.2)
        doc.contents.format = 'HEX'
        expect(String(doc)).toBe('4.2\n')
      })
      test('negative integer with HEX format', () => {
        const doc = new YAML.Document(-42)
        doc.contents.format = 'HEX'
        const exp = version === '1.2' ? '-42\n' : '-0x2a\n'
        expect(String(doc)).toBe(exp)
      })

      test('BigInt', () => {
        expect(YAML.stringify(BigInt('-42'))).toBe('-42\n')
      })
      test('BigInt with HEX format', () => {
        const doc = new YAML.Document(BigInt('42'))
        doc.contents.format = 'HEX'
        expect(String(doc)).toBe('0x2a\n')
      })
      test('BigInt with OCT format', () => {
        const doc = new YAML.Document(BigInt('42'))
        doc.contents.format = 'OCT'
        const exp = version === '1.2' ? '0o52\n' : '052\n'
        expect(String(doc)).toBe(exp)
      })
      test('negative BigInt with OCT format', () => {
        const doc = new YAML.Document(BigInt('-42'))
        doc.contents.format = 'OCT'
        const exp = version === '1.2' ? '-42\n' : '-052\n'
        expect(String(doc)).toBe(exp)
      })
    })

    describe('string', () => {
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

      test('plain', () => {
        expect(YAML.stringify('STR')).toBe('STR\n')
      })
      test('double-quoted', () => {
        expect(YAML.stringify('"x"')).toBe('\'"x"\'\n')
      })
      test('single-quoted', () => {
        expect(YAML.stringify("'x'")).toBe('"\'x\'"\n')
      })
      test('escaped', () => {
        expect(YAML.stringify('null: \u0000')).toBe('"null: \\0"\n')
      })
      test('short multiline', () => {
        expect(YAML.stringify('blah\nblah\nblah')).toBe(
          '|-\nblah\nblah\nblah\n'
        )
      })
      test('long multiline', () => {
        expect(
          YAML.stringify(
            'blah blah\nblah blah blah blah blah blah blah blah blah blah\n'
          )
        ).toBe(`>
blah blah

blah blah blah blah
blah blah blah blah
blah blah\n`)
      })

      test('long line in map', () => {
        const foo = 'fuzz'.repeat(16)
        const doc = new YAML.Document({ foo })
        for (const node of doc.contents.items)
          node.value.type = Type.QUOTE_DOUBLE
        expect(
          String(doc)
            .split('\n')
            .map(line => line.length)
        ).toMatchObject([20, 20, 20, 20, 0])
      })

      test('long line in sequence', () => {
        const foo = 'fuzz'.repeat(16)
        const doc = new YAML.Document([foo])
        for (const node of doc.contents.items) node.type = Type.QUOTE_DOUBLE
        expect(
          String(doc)
            .split('\n')
            .map(line => line.length)
        ).toMatchObject([20, 20, 20, 17, 0])
      })

      test('long line in sequence in map', () => {
        const foo = 'fuzz'.repeat(16)
        const doc = new YAML.Document({ foo: [foo] })
        const seq = doc.contents.items[0].value
        for (const node of seq.items) node.type = Type.QUOTE_DOUBLE
        expect(
          String(doc)
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

describe('circular references', () => {
  test('parent at root', () => {
    const map = { foo: 'bar' }
    map.map = map
    expect(YAML.stringify(map)).toBe(`&a1
foo: bar
map: *a1\n`)
  })

  test('ancestor at root', () => {
    const baz = {}
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
      baz:
        &a1
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
    expect(YAML.stringify(set)).toBe('? a\n? b\n')
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
    const doc = new YAML.Document({ x: 3, y: 4 })
    expect(String(doc)).toBe('x: 3\ny: 4\n')
    doc.contents.items.push('TEST')
    expect(() => String(doc)).toThrow(/^Map items must all be pairs.*TEST/)
  })

  test('Keep block scalar types for keys', () => {
    const doc = YAML.parseDocument('? >+ #comment\n foo\n\n: bar')
    expect(String(doc)).toBe('? >+ #comment\n  foo\n\n: bar\n')
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

describe('eemeli/yaml#80: custom tags', () => {
  const regexp = {
    identify: value => value instanceof RegExp,
    tag: '!re',
    resolve(doc, cst) {
      const match = cst.strValue.match(/^\/([\s\S]+)\/([gimuy]*)$/)
      return new RegExp(match[1], match[2])
    }
  }

  const sharedSymbol = {
    identify: value => value.constructor === Symbol,
    tag: '!symbol/shared',
    resolve: (doc, cst) => Symbol.for(cst.strValue),
    stringify(item, ctx, onComment, onChompKeep) {
      const key = Symbol.keyFor(item.value)
      if (key === undefined)
        throw new Error('Only shared symbols are supported')
      return stringifyString({ value: key }, ctx, onComment, onChompKeep)
    }
  }

  beforeAll(() => {
    YAML.defaultOptions.customTags = [regexp, sharedSymbol]
  })

  afterAll(() => {
    YAML.defaultOptions.customTags = []
  })

  describe('RegExp', () => {
    test('stringify as plain scalar', () => {
      const str = YAML.stringify(/re/g)
      expect(str).toBe('!re /re/g\n')
      const res = YAML.parse(str)
      expect(res).toBeInstanceOf(RegExp)
    })

    test('stringify as quoted scalar', () => {
      const str = YAML.stringify(/re: /g)
      expect(str).toBe('!re "/re: /g"\n')
      const res = YAML.parse(str)
      expect(res).toBeInstanceOf(RegExp)
    })

    test('parse plain string as string', () => {
      const res = YAML.parse('/re/g')
      expect(res).toBe('/re/g')
    })

    test('parse quoted string as string', () => {
      const res = YAML.parse('"/re/g"')
      expect(res).toBe('/re/g')
    })
  })

  describe('Symbol', () => {
    test('stringify as plain scalar', () => {
      const symbol = Symbol.for('foo')
      const str = YAML.stringify(symbol)
      expect(str).toBe('!symbol/shared foo\n')
      const res = YAML.parse(str)
      expect(res).toBe(symbol)
    })

    test('stringify as block scalar', () => {
      const symbol = Symbol.for('foo\nbar')
      const str = YAML.stringify(symbol)
      expect(str).toBe('!symbol/shared |-\nfoo\nbar\n')
      const res = YAML.parse(str)
      expect(res).toBe(symbol)
    })
  })
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
    expect(YAML.parse(str2)).toMatchObject(doc.toJSON())
  })
})

test('eemeli/yaml#87', () => {
  const doc = YAML.parseDocument('test: x')
  doc.set('test', { a: 'test' })
  expect(String(doc)).toBe('test:\n  a: test\n')
})

describe('simple keys', () => {
  test('key with null value', () => {
    const doc = YAML.parseDocument('~: ~')
    expect(String(doc)).toBe('? null\n')
    doc.options.simpleKeys = true
    expect(String(doc)).toBe('null: null\n')
  })

  test('key with block scalar value', () => {
    const doc = YAML.parseDocument('foo: bar')
    doc.contents.items[0].key.type = 'BLOCK_LITERAL'
    expect(String(doc)).toBe('? |-\n  foo\n: bar\n')
    doc.options.simpleKeys = true
    expect(String(doc)).toBe('"foo": bar\n')
  })

  test('key with comment', () => {
    const doc = YAML.parseDocument('foo: bar')
    doc.contents.items[0].key.comment = 'FOO'
    expect(String(doc)).toBe('? foo #FOO\n: bar\n')
    doc.options.simpleKeys = true
    expect(() => String(doc)).toThrow(
      /With simple keys, key nodes cannot have comments/
    )
  })

  test('key with collection value', () => {
    const doc = YAML.parseDocument('[foo]: bar')
    expect(String(doc)).toBe('? [ foo ]\n: bar\n')
    doc.options.simpleKeys = true
    expect(() => String(doc)).toThrow(
      /With simple keys, collection cannot be used as a key value/
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
  expect(YAML.stringify(obj)).toBe(
    source`
      array:
        - 1
      map:
        #mc
        foo: bar
        seq:
          #sc
          - a
    ` + '\n'
  )
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
    const sortMapEntries = (a, b) =>
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
  let obj
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
    expect(YAML.stringify(obj, { indent: 1 })).toBe(
      source`
       array:
        - a: 1
          b: 2
       map:
        #mc
        foo: bar
        seq:
         #sc
         - a
      ` + '\n'
    )
  })

  test('indent: 4', () => {
    expect(YAML.stringify(obj, { indent: 4 })).toBe(
      source`
          array:
              - a: 1
                b: 2
          map:
              #mc
              foo: bar
              seq:
                  #sc
                  - a
      ` + '\n'
    )
  })
})

describe('indentSeq: false', () => {
  let obj
  beforeEach(() => {
    const seq = new YAML.Document().createNode(['a'])
    seq.commentBefore = 'sc'
    obj = { array: [{ a: 1, b: 2 }], map: { seq } }
  })

  test('indent: 1', () => {
    expect(YAML.stringify(obj, { indent: 1, indentSeq: false })).toBe(
      source`
        array:
         - a: 1
           b: 2
        map:
         seq:
          #sc
          - a
      ` + '\n'
    )
  })

  test('indent: 2', () => {
    expect(YAML.stringify(obj, { indent: 2, indentSeq: false })).toBe(
      source`
        array:
        - a: 1
          b: 2
        map:
          seq:
            #sc
          - a
      ` + '\n'
    )
  })

  test('indent: 4', () => {
    expect(YAML.stringify(obj, { indent: 4, indentSeq: false })).toBe(
      source`
        array:
          - a: 1
            b: 2
        map:
            seq:
                #sc
              - a
      ` + '\n'
    )
  })
})

describe('Scalar options', () => {
  describe('str.defaultType & str.defaultKeyType', () => {
    let origDefaultType, origDefaultKeyType
    beforeAll(() => {
      origDefaultType = YAML.scalarOptions.str.defaultType
      origDefaultKeyType = YAML.scalarOptions.str.defaultKeyType
    })
    afterAll(() => {
      YAML.scalarOptions.str.defaultType = origDefaultType
      YAML.scalarOptions.str.defaultKeyType = origDefaultKeyType
    })

    test('PLAIN, PLAIN', () => {
      YAML.scalarOptions.str.defaultType = Type.PLAIN
      YAML.scalarOptions.str.defaultKeyType = Type.PLAIN
      expect(YAML.stringify({ foo: 'bar' })).toBe('foo: bar\n')
    })

    test('BLOCK_FOLDED, BLOCK_FOLDED', () => {
      YAML.scalarOptions.str.defaultType = Type.BLOCK_FOLDED
      YAML.scalarOptions.str.defaultKeyType = Type.BLOCK_FOLDED
      expect(YAML.stringify({ foo: 'bar' })).toBe('"foo": |-\n  bar\n')
    })

    test('QUOTE_DOUBLE, PLAIN', () => {
      YAML.scalarOptions.str.defaultType = Type.QUOTE_DOUBLE
      YAML.scalarOptions.str.defaultKeyType = Type.PLAIN
      expect(YAML.stringify({ foo: 'bar' })).toBe('foo: "bar"\n')
    })

    test('QUOTE_DOUBLE, QUOTE_SINGLE', () => {
      YAML.scalarOptions.str.defaultType = Type.QUOTE_DOUBLE
      YAML.scalarOptions.str.defaultKeyType = Type.QUOTE_SINGLE
      expect(YAML.stringify({ foo: 'bar' })).toBe('\'foo\': "bar"\n')
    })

    test('Use defaultType for explicit keys', () => {
      YAML.scalarOptions.str.defaultType = Type.QUOTE_DOUBLE
      YAML.scalarOptions.str.defaultKeyType = Type.QUOTE_SINGLE
      expect(YAML.stringify({ foo: null })).toBe('? "foo"\n')
    })
  })

  describe('str.defaultQuoteSingle', () => {
    let origDefaultQuoteOption
    beforeAll(() => {
      origDefaultQuoteOption = YAML.scalarOptions.str.defaultQuoteSingle
    })
    afterAll(() => {
      YAML.scalarOptions.str.defaultQuoteSingle = origDefaultQuoteOption
    })

    const testSingleQuote = str => {
      const expected = `'${str}'\n`
      const actual = YAML.stringify(str)
      expect(actual).toBe(expected)
      expect(YAML.parse(actual)).toBe(str)
    }
    const testDoubleQuote = str => {
      const expected = `"${str}"\n`
      const actual = YAML.stringify(str)
      expect(actual).toBe(expected)
      expect(YAML.parse(actual)).toBe(str)
    }

    const testPlainStyle = () => {
      const str = YAML.stringify('foo bar')
      expect(str).toBe('foo bar\n')
    }
    const testForcedQuotes = () => {
      let str = YAML.stringify('foo: "bar"')
      expect(str).toBe(`'foo: "bar"'\n`)
      str = YAML.stringify("foo: 'bar'")
      expect(str).toBe(`"foo: 'bar'"\n`)
    }

    test('default', () => {
      YAML.scalarOptions.str.defaultQuoteSingle = origDefaultQuoteOption
      testPlainStyle()
      testForcedQuotes()
      testDoubleQuote('123')
      testDoubleQuote('foo #bar')
    })
    test("'", () => {
      YAML.scalarOptions.str.defaultQuoteSingle = true
      testPlainStyle()
      testForcedQuotes()
      testDoubleQuote('123') // number-as-string is double-quoted
      testSingleQuote('foo #bar')
    })
    test('"', () => {
      YAML.scalarOptions.str.defaultQuoteSingle = false
      testPlainStyle()
      testForcedQuotes()
      testDoubleQuote('123')
      testDoubleQuote('foo #bar')
    })
  })
})

describe('Document markers in top-level scalars', () => {
  let origDoubleQuotedOptions
  beforeAll(() => {
    origDoubleQuotedOptions = YAML.scalarOptions.str.doubleQuoted
    YAML.scalarOptions.str.doubleQuoted = {
      jsonEncoding: false,
      minMultiLineLength: 0
    }
  })
  afterAll(() => {
    YAML.scalarOptions.str.doubleQuoted = origDoubleQuotedOptions
  })

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
    const doc = new YAML.Document('foo\n...')
    doc.contents.type = Type.QUOTE_SINGLE
    const str = String(doc)
    expect(str).toBe("'foo\n\n  ...'\n")
    expect(YAML.parse(str)).toBe('foo\n...')
  })

  test('"foo\\n..."', () => {
    const doc = new YAML.Document('foo\n...')
    doc.contents.type = Type.QUOTE_DOUBLE
    const str = String(doc)
    expect(str).toBe('"foo\n\n  ..."\n')
    expect(YAML.parse(str)).toBe('foo\n...')
  })

  test('foo\\n%bar\\n', () => {
    const str = YAML.stringify('foo\n%bar\n')
    expect(str).toBe('|\n  foo\n  %bar\n')
    expect(YAML.parse(str)).toBe('foo\n%bar\n')
  })
})

describe('undefined values', () => {
  test('undefined', () => {
    expect(YAML.stringify(undefined)).toBe('\n')
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
    const map = new Map([
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
    const map = new Map([
      ['a', 1],
      ['3', 2],
      [3, 4]
    ])
    expect(YAML.stringify(map, [3])).toBe('"3": 2\n3: 4\n')
  })

  test('function as logger', () => {
    const spy = jest.fn((key, value) => value)
    const obj = { 1: 1, b: 2, c: [4] }
    YAML.stringify(obj, spy)
    expect(spy.mock.calls).toMatchObject([
      ['', obj],
      ['1', 1],
      ['b', 2],
      ['c', [4]],
      ['0', 4]
    ])
  })

  test('function as filter of Object entries', () => {
    const obj = { 1: 1, b: 2, c: [4] }
    const fn = (key, value) => (typeof value === 'number' ? undefined : value)
    expect(YAML.stringify(obj, fn)).toBe('c:\n  - null\n')
  })

  test('function as filter of Map entries', () => {
    const map = new Map([
      [1, 1],
      ['b', 2],
      ['c', [4]]
    ])
    const fn = (key, value) => (typeof value === 'number' ? undefined : value)
    expect(YAML.stringify(map, fn)).toBe('c:\n  - null\n')
  })

  test('function as transformer', () => {
    const obj = { a: 1, b: 2, c: [3, 4] }
    const fn = (key, value) => (typeof value === 'number' ? 2 * value : value)
    expect(YAML.stringify(obj, fn)).toBe('a: 2\nb: 4\nc:\n  - 6\n  - 8\n')
  })

  test('createNode, !!set', () => {
    const replacer = jest.fn((key, value) => value)
    const doc = new YAML.Document(null, { customTags: ['set'] })
    const set = new Set(['a', 'b', 1, [2]])
    doc.createNode(set, { replacer })
    expect(replacer.mock.calls).toMatchObject([
      ['', set],
      ['0', 'a'],
      ['1', 'b'],
      ['2', 1],
      ['3', [2]],
      ['0', 2]
    ])
  })

  test('createNode, !!omap', () => {
    const replacer = jest.fn((key, value) => value)
    const doc = new YAML.Document(null, { customTags: ['omap'] })
    const omap = [
      ['a', 1],
      [1, 'a']
    ]
    doc.createNode(omap, { replacer, tag: '!!omap' })
    expect(replacer.mock.calls).toMatchObject([
      ['', omap],
      ['0', omap[0]],
      ['1', omap[1]]
    ])
  })
})
