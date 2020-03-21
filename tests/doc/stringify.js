/* global BigInt */

import { source } from 'common-tags'
import { YAML } from '../../src/index'
import { Pair } from '../../src/schema/Pair'
import { Type } from '../../src/constants'
import { stringifyString } from '../../src/stringify'

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
        const doc = new YAML.Document()
        doc.contents = YAML.createNode(3, true)
        doc.contents.minFractionDigits = 2
        expect(String(doc)).toBe('3.00\n')
      })
      test('scientific float ignores minFractionDigits', () => {
        const doc = new YAML.Document()
        doc.contents = YAML.createNode(3, true)
        doc.contents.format = 'EXP'
        doc.contents.minFractionDigits = 2
        expect(String(doc)).toBe('3e+0\n')
      })

      test('integer with HEX format', () => {
        const doc = new YAML.Document()
        doc.contents = YAML.createNode(42, true)
        doc.contents.format = 'HEX'
        expect(String(doc)).toBe('0x2a\n')
      })
      test('float with HEX format', () => {
        const doc = new YAML.Document()
        doc.contents = YAML.createNode(4.2, true)
        doc.contents.format = 'HEX'
        expect(String(doc)).toBe('4.2\n')
      })
      test('negative integer with HEX format', () => {
        const doc = new YAML.Document()
        doc.contents = YAML.createNode(-42, true)
        doc.contents.format = 'HEX'
        const exp = version === '1.2' ? '-42\n' : '-0x2a\n'
        expect(String(doc)).toBe(exp)
      })

      test('BigInt', () => {
        expect(YAML.stringify(BigInt('-42'))).toBe('-42\n')
      })
      test('BigInt with HEX format', () => {
        const doc = new YAML.Document()
        doc.contents = YAML.createNode(BigInt('42'), true)
        doc.contents.format = 'HEX'
        expect(String(doc)).toBe('0x2a\n')
      })
      test('BigInt with OCT format', () => {
        const doc = new YAML.Document()
        doc.contents = YAML.createNode(BigInt('42'), true)
        doc.contents.format = 'OCT'
        const exp = version === '1.2' ? '0o52\n' : '052\n'
        expect(String(doc)).toBe(exp)
      })
      test('negative BigInt with OCT format', () => {
        const doc = new YAML.Document()
        doc.contents = YAML.createNode(BigInt('-42'), true)
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
        const doc = new YAML.Document()
        doc.contents = YAML.createNode({ foo })
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
        const doc = new YAML.Document()
        doc.contents = YAML.createNode([foo])
        for (const node of doc.contents.items) node.type = Type.QUOTE_DOUBLE
        expect(
          String(doc)
            .split('\n')
            .map(line => line.length)
        ).toMatchObject([20, 20, 20, 17, 0])
      })

      test('long line in sequence in map', () => {
        const foo = 'fuzz'.repeat(16)
        const doc = new YAML.Document()
        doc.contents = YAML.createNode({ foo: [foo] })
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
    const doc = new YAML.Document()
    doc.contents = YAML.createNode({ x: 3, y: 4 })
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
  const doc = new YAML.Document()
  doc.contents = YAML.createNode({ key: ':' })
  const str = String(doc)
  expect(() => YAML.parse(str)).not.toThrow()
  expect(str).toBe('key: ":"\n')
})

test('eemeli/yaml#52: Quoting item markers', () => {
  const doc = new YAML.Document()
  doc.contents = YAML.createNode({ key: '-' })
  const str = String(doc)
  expect(() => YAML.parse(str)).not.toThrow()
  expect(str).toBe('key: "-"\n')
  doc.contents = YAML.createNode({ key: '?' })
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
  const seq = YAML.createNode(['a'])
  seq.commentBefore = 'sc'
  const map = YAML.createNode({ foo: 'bar', seq })
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
    const doc = new YAML.Document({ sortMapEntries: true })
    doc.setSchema()
    doc.contents = doc.schema.createNode(obj)
    doc.add(new Pair('bb', 4))
    expect(String(doc)).toBe('a: 1\nb: 2\nbb: 4\nc: 3\n')
  })
  test('doc.set', () => {
    const doc = new YAML.Document({ sortMapEntries: true })
    doc.setSchema()
    doc.contents = doc.schema.createNode(obj)
    doc.set('bb', 4)
    expect(String(doc)).toBe('a: 1\nb: 2\nbb: 4\nc: 3\n')
  })
})
