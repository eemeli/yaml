import fs from 'fs'
import path from 'path'
import * as YAML from 'yaml'

describe('scalars', () => {
  test('empty block scalar at end of document', () => {
    const docs = YAML.parseAllDocuments('|\n---\nfoo')
    expect(docs.map(doc => doc.toJS())).toMatchObject(['', 'foo'])
  })

  test('carriage returns in double-quotes', () => {
    const src = '"a\nb\n\rc\n\r\nd\n\r\n\re\n\r\n\r\nf"'
    expect(YAML.parse(src)).toBe('a b \rc\nd\n\re\n\nf')
  })
})

describe('tags', () => {
  describe('implicit tags', () => {
    test('plain string', () => {
      const doc = YAML.parseDocument('foo')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.value).toBe('foo')
    })
    test('quoted string', () => {
      const doc = YAML.parseDocument('"foo"')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.value).toBe('foo')
    })
    test('flow map', () => {
      const doc = YAML.parseDocument('{ foo }')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.toJSON()).toMatchObject({ foo: null })
    })
    test('flow seq', () => {
      const doc = YAML.parseDocument('[ foo ]')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.toJSON()).toMatchObject(['foo'])
    })
    test('block map', () => {
      const doc = YAML.parseDocument('foo:\n')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.toJSON()).toMatchObject({ foo: null })
    })
    test('block seq', () => {
      const doc = YAML.parseDocument('- foo')
      expect(doc.contents.tag).toBeUndefined()
      expect(doc.contents.toJSON()).toMatchObject(['foo'])
    })
  })

  describe('explicit tags', () => {
    test('plain string', () => {
      const doc = YAML.parseDocument('!!str foo')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:str')
      expect(doc.contents.value).toBe('foo')
    })
    test('quoted string', () => {
      const doc = YAML.parseDocument('!!str "foo"')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:str')
      expect(doc.contents.value).toBe('foo')
    })
    test('flow map', () => {
      const doc = YAML.parseDocument('!!map { foo }')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:map')
      expect(doc.contents.toJSON()).toMatchObject({ foo: null })
    })
    test('flow seq', () => {
      const doc = YAML.parseDocument('!!seq [ foo ]')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:seq')
      expect(doc.contents.toJSON()).toMatchObject(['foo'])
    })
    test('block map', () => {
      const doc = YAML.parseDocument('!!map\nfoo:\n')
      expect(doc.contents.tag).toBe('tag:yaml.org,2002:map')
      expect(doc.contents.toJSON()).toMatchObject({ foo: null })
    })
    test('block seq', () => {
      const doc = YAML.parseDocument('!!seq\n- foo')
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
        const doc = YAML.parseDocument(tag)
        expect(doc.errors).not.toHaveLength(0)
        expect(doc.errors[0].code).toBe('MISSING_CHAR')
      })
    }
  })

  test('eemeli/yaml#97', () => {
    const doc = YAML.parseDocument('foo: !!float 3.0')
    expect(String(doc)).toBe('foo: !!float 3.0\n')
  })
})

describe('custom string on node', () => {
  test('tiled null', () => {
    const doc = YAML.parse('a: null')
    const str = YAML.stringify(doc, { nullStr: '~', simpleKeys: true })
    expect(str).toBe('a: ~\n')
    expect(YAML.parse(str)).toEqual({ a: null })
  })

  test('empty string null', () => {
    const doc = YAML.parse('a: null')
    const str = YAML.stringify(doc, { nullStr: '', simpleKeys: true })
    expect(str).toBe('a: \n')
    expect(YAML.parse(str)).toEqual({ a: null })
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
      const doc = YAML.parseDocument(src, {
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
      const doc = YAML.parseDocument(src, {
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
      const doc = YAML.parseDocument(src, { intAsBigInt: true, version: '1.1' })
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
      const doc = YAML.parseDocument(src, { intAsBigInt: true, version: '1.2' })
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
  expect(YAML.parse(src)).toMatchObject({
    aliases: [
      { docker: [{ image: 'circleci/node:8.11.2' }] },
      { key: 'repository-{{ .Revision }}' }
    ]
  })
})

test('eemeli/yaml#3', () => {
  const src = '{ ? : 123 }'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toHaveLength(0)
  expect(doc.contents.items[0].key.value).toBeNull()
  expect(doc.contents.items[0].value.value).toBe(123)
})

describe('eemeli/yaml#10', () => {
  test('reported', () => {
    const src = `
aliases:
  - restore_cache:
      - v1-yarn-cache
  - save_cache:
      paths:
        - ~/.cache/yarn
  - &restore_deps_cache
    keys:
      - v1-deps-cache-{{ checksum "yarn.lock" }}\n`
    const docs = YAML.parseAllDocuments(src)
    expect(docs).toHaveLength(1)
    expect(docs[0].errors).toHaveLength(0)
  })

  test('complete file', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../artifacts/prettier-circleci-config.yml'),
      'utf8'
    )
    const doc = YAML.parseDocument(src)
    expect(doc.toJS()).toMatchObject({
      aliases: [
        { restore_cache: { keys: ['v1-yarn-cache'] } },
        { save_cache: { key: 'v1-yarn-cache', paths: ['~/.cache/yarn'] } },
        {
          restore_cache: { keys: ['v1-deps-cache-{{ checksum "yarn.lock" }}'] }
        },
        {
          save_cache: {
            key: 'v1-yarn-deps-{{ checksum "yarn.lock" }}',
            paths: ['node_modules']
          }
        },
        {
          docker: [{ image: 'circleci/node:9' }],
          working_directory: '~/prettier'
        }
      ],
      jobs: {
        build_prod: {
          '<<': {
            docker: [{ image: 'circleci/node:9' }],
            working_directory: '~/prettier'
          },
          environment: { NODE_ENV: 'production' },
          steps: [
            { attach_workspace: { at: '~/prettier' } },
            { run: 'yarn build' },
            { persist_to_workspace: { paths: ['dist'], root: '.' } },
            { store_artifacts: { path: '~/prettier/dist' } }
          ]
        },
        checkout_code: {
          '<<': {
            docker: [{ image: 'circleci/node:9' }],
            working_directory: '~/prettier'
          },
          steps: [
            'checkout',
            { restore_cache: { keys: ['v1-yarn-cache'] } },
            {
              restore_cache: {
                keys: ['v1-deps-cache-{{ checksum "yarn.lock" }}']
              }
            },
            { run: 'yarn install' },
            { run: 'yarn check-deps' },
            {
              save_cache: {
                key: 'v1-yarn-deps-{{ checksum "yarn.lock" }}',
                paths: ['node_modules']
              }
            },
            { save_cache: { key: 'v1-yarn-cache', paths: ['~/.cache/yarn'] } },
            { persist_to_workspace: { paths: ['.'], root: '.' } }
          ]
        },
        test_prod_node4: {
          '<<': {
            docker: [{ image: 'circleci/node:9' }],
            working_directory: '~/prettier'
          },
          docker: [{ image: 'circleci/node:4' }],
          steps: [
            { attach_workspace: { at: '~/prettier' } },
            { run: 'yarn test:dist' }
          ]
        },
        test_prod_node9: {
          '<<': {
            docker: [{ image: 'circleci/node:9' }],
            working_directory: '~/prettier'
          },
          steps: [
            { attach_workspace: { at: '~/prettier' } },
            { run: 'yarn test:dist' }
          ]
        }
      },
      version: 2,
      workflows: {
        prod: {
          jobs: [
            'checkout_code',
            { build_prod: { requires: ['checkout_code'] } },
            { test_prod_node4: { requires: ['build_prod'] } },
            { test_prod_node9: { requires: ['build_prod'] } }
          ]
        },
        version: 2
      }
    })
    const exp = src.replace(/\r\n/g, '\n') // To account for git core.autocrlf true on Windows
    expect(String(doc)).toBe(exp)
  })

  test('minimal', () => {
    const src = `
  - a
  - b:
    - c
  - d`
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toHaveLength(0)
    expect(docs[0].toJS()).toMatchObject(['a', { b: ['c'] }, 'd'])
  })
})

describe('eemeli/yaml#19', () => {
  test('map', () => {
    const src = 'a:\n  # 123'
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe('a: null # 123\n')
  })

  test('seq', () => {
    const src = '- a: # 123'
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe('- a: null # 123\n')
  })
})

test('eemeli/yaml#32', () => {
  expect(YAML.parse('[ ? ]')).toEqual([{ '': null }])
  expect(YAML.parse('[? 123]')).toEqual([{ 123: null }])
  expect(YAML.parse('[ 123, ? ]')).toEqual([123, { '': null }])
  expect(YAML.parse('[ 123, ? 456 ]')).toEqual([123, { 456: null }])
})

test('eemeli/yaml#34', () => {
  expect(YAML.parse('|')).toEqual('')
})

test('eemeli/yaml#36', () => {
  expect(() => YAML.parse(`{ x: ${'x'.repeat(1024)} }`)).not.toThrowError()
})

test('eemeli/yaml#38', () => {
  const src = `
  content:
    arrayOfArray:
    -
      - first: John
        last: Black
      - first: Brian
        last: Green
    -
      - first: Mark
        last: Orange
    -
      - first: Adam
        last: Grey
  `
  expect(YAML.parse(src)).toEqual({
    content: {
      arrayOfArray: [
        [
          { first: 'John', last: 'Black' },
          { first: 'Brian', last: 'Green' }
        ],
        [{ first: 'Mark', last: 'Orange' }],
        [{ first: 'Adam', last: 'Grey' }]
      ]
    }
  })
})

test('eemeli/yaml#120', () => {
  const src = `test:
    - test1: test1
      test2:`
  expect(YAML.parse(src)).toEqual({
    test: [{ test1: 'test1', test2: null }]
  })
})

test('comment between key & : in flow collection (eemeli/yaml#149)', () => {
  const src1 = '{"a"\n#c\n:1}'
  expect(YAML.parse(src1)).toEqual({ a: 1 })

  const src2 = '{a\n#c\n:1}'
  expect(async () => YAML.parse(src2)).rejects.toMatchObject({
    code: 'MISSING_CHAR'
  })
})

describe('empty(ish) nodes', () => {
  test('empty node position', () => {
    const doc = YAML.parseDocument('\r\na: # 123\r\n')
    const empty = doc.contents.items[0].value
    expect(empty.range).toEqual([5, 5, 5])
  })

  test('parse an empty string as null', () => {
    const value = YAML.parse('')
    expect(value).toBeNull()
  })

  test('parse a non-space WS char as itself', () => {
    const src = '\u{2002}' // en space
    const value = YAML.parse(src)
    expect(value).toBe(src)
  })
})

test('comment on single-line value in flow map', () => {
  const src = '{a: 1 #c\n}'
  const doc = YAML.parseDocument(src)
  expect(String(doc)).toBe('{\n  a: 1 #c\n}\n')
})

describe('maps with no values', () => {
  test('block map', () => {
    const src = `a: null\n? b #c`
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe(`a: null\n? b #c\n`)
    doc.set('b', 'x')
    expect(String(doc)).toBe(`a: null\nb: #c\n  x\n`)
  })

  test('flow map', () => {
    const src = `{\na: null,\n? b\n}`
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe(`{ a: null, b }\n`)
    doc.contents.items[1].key.comment = 'c'
    expect(String(doc)).toBe(`{\n  a: null,\n  b #c\n}\n`)
    doc.set('b', 'x')
    expect(String(doc)).toBe(`{\n  a: null,\n  b: #c\n    x\n}\n`)
  })

  test('flow map has correct range', () => {
    const doc = YAML.parseDocument('{  }')
    expect(doc.range).toEqual([0, 4, 4])
  })

  test('implicit scalar key after explicit key with no value', () => {
    const doc = YAML.parseDocument('? - 1\nx:\n')
    expect(doc.contents.items).toMatchObject([
      { key: { items: [{ value: 1 }] }, value: null },
      { key: { value: 'x' }, value: { value: null } }
    ])
  })

  test('implicit flow collection key after explicit key with no value', () => {
    const doc = YAML.parseDocument('? - 1\n[x]: y\n')
    expect(doc.contents.items).toMatchObject([
      { key: { items: [{ value: 1 }] }, value: null },
      { key: { items: [{ value: 'x' }] }, value: { value: 'y' } }
    ])
  })
})

describe('Excessive entity expansion attacks', () => {
  const root = path.resolve(__dirname, '../artifacts/pr104')
  const src1 = fs.readFileSync(path.resolve(root, 'case1.yml'), 'utf8')
  const src2 = fs.readFileSync(path.resolve(root, 'case2.yml'), 'utf8')
  const srcB = fs.readFileSync(path.resolve(root, 'billion-laughs.yml'), 'utf8')
  const srcQ = fs.readFileSync(path.resolve(root, 'quadratic.yml'), 'utf8')

  let origEmitWarning
  beforeAll(() => {
    origEmitWarning = process.emitWarning
  })
  afterAll(() => {
    process.emitWarning = origEmitWarning
  })

  describe('Limit count by default', () => {
    for (const [name, src] of [
      ['js-yaml case 1', src1],
      ['js-yaml case 2', src2],
      ['billion laughs', srcB],
      ['quadratic expansion', srcQ]
    ]) {
      test(name, () => {
        process.emitWarning = jest.fn()
        expect(() => YAML.parse(src)).toThrow(/Excessive alias count/)
      })
    }
  })

  describe('Work sensibly even with disabled limits', () => {
    test('js-yaml case 1', () => {
      process.emitWarning = jest.fn()
      const obj = YAML.parse(src1, { maxAliasCount: -1 })
      expect(obj).toMatchObject({})
      const key = Object.keys(obj)[0]
      expect(key.length).toBeGreaterThan(2000)
      expect(key.length).toBeLessThan(8000)
      expect(process.emitWarning).toHaveBeenCalled()
    })

    test('js-yaml case 2', () => {
      const arr = YAML.parse(src2, { maxAliasCount: -1 })
      expect(arr).toHaveLength(2)
      const key = Object.keys(arr[1])[0]
      expect(key).toBe('*id057')
    })

    test('billion laughs', () => {
      const obj = YAML.parse(srcB, { maxAliasCount: -1 })
      expect(Object.keys(obj)).toHaveLength(9)
    })

    test('quadratic expansion', () => {
      const obj = YAML.parse(srcQ, { maxAliasCount: -1 })
      expect(Object.keys(obj)).toHaveLength(11)
    })
  })

  describe('maxAliasCount limits', () => {
    const rows = [
      'a: &a [lol, lol, lol, lol, lol, lol, lol, lol, lol]',
      'b: &b [*a, *a, *a, *a, *a, *a, *a, *a, *a]',
      'c: &c [*b, *b, *b, *b]',
      'd: &d [*c, *c]',
      'e: [*d]'
    ]

    test(`depth 0: maxAliasCount 1 passes`, () => {
      expect(() => YAML.parse(rows[0], { maxAliasCount: 1 })).not.toThrow()
    })

    test(`depth 1: maxAliasCount 1 fails on first alias`, () => {
      const src = `${rows[0]}\nb: *a`
      expect(() => YAML.parse(src, { maxAliasCount: 1 })).toThrow()
    })

    const limits = [10, 50, 150, 300]
    for (let i = 0; i < 4; ++i) {
      const src = rows.slice(0, i + 2).join('\n')

      test(`depth ${i + 1}: maxAliasCount ${limits[i] - 1} fails`, () => {
        expect(() =>
          YAML.parse(src, { maxAliasCount: limits[i] - 1 })
        ).toThrow()
      })

      test(`depth ${i + 1}: maxAliasCount ${limits[i]} passes`, () => {
        expect(() =>
          YAML.parse(src, { maxAliasCount: limits[i] })
        ).not.toThrow()
      })
    }
  })
})

test('Anchor for empty node (6KGN)', () => {
  const src = `a: &anchor\nb: *anchor`
  expect(YAML.parse(src)).toMatchObject({ a: null, b: null })
})

describe('duplicate keys', () => {
  test('block collection scalars', () => {
    const doc = YAML.parseDocument('foo: 1\nbar: 2\nfoo: 3\n')
    expect(doc.errors).toMatchObject([{ code: 'DUPLICATE_KEY' }])
  })

  test('flow collection scalars', () => {
    const doc = YAML.parseDocument('{ foo: 1, bar: 2, foo: 3 }\n')
    expect(doc.errors).toMatchObject([{ code: 'DUPLICATE_KEY' }])
  })

  test('merge key (disabled)', () => {
    const doc = YAML.parseDocument('<<: 1\nbar: 2\n<<: 3\n', { merge: false })
    expect(doc.errors).toMatchObject([{ code: 'DUPLICATE_KEY' }])
  })

  test('disable with option', () => {
    const doc = YAML.parseDocument('foo: 1\nbar: 2\nfoo: 3\n', {
      uniqueKeys: false
    })
    expect(doc.errors).toMatchObject([])
  })

  test('customise with option', () => {
    const doc = YAML.parseDocument('foo: 1\nbar: 2\nfoo: 3\n', {
      uniqueKeys: () => true
    })
    expect(doc.errors).toMatchObject([
      { code: 'DUPLICATE_KEY' },
      { code: 'DUPLICATE_KEY' }
    ])
  })
})

describe('handling complex keys', () => {
  let origEmitWarning
  beforeAll(() => {
    origEmitWarning = process.emitWarning
  })
  afterAll(() => {
    process.emitWarning = origEmitWarning
  })

  test('emit warning when casting key in collection to string as JS Object key', () => {
    process.emitWarning = jest.fn()
    const doc = YAML.parseDocument('[foo]: bar', { prettyErrors: false })
    expect(doc.warnings).toHaveLength(0)
    expect(process.emitWarning).not.toHaveBeenCalled()

    doc.toJS()
    expect(process.emitWarning).toHaveBeenCalledTimes(1)
    expect(process.emitWarning.mock.calls[0][0]).toMatch(
      /^Keys with collection values will be stringified due to JS Object restrictions/
    )
  })

  test('do not add warning when using mapIsMap: true', () => {
    process.emitWarning = jest.fn()
    const doc = YAML.parseDocument('[foo]: bar')
    doc.toJS({ mapAsMap: true })
    expect(doc.warnings).toMatchObject([])
    expect(process.emitWarning).not.toHaveBeenCalled()
  })

  test('warn when casting key in collection to string', () => {
    process.emitWarning = jest.fn()
    const obj = YAML.parse('[foo]: bar')
    expect(Object.keys(obj)).toMatchObject(['[ foo ]'])
    expect(process.emitWarning).toHaveBeenCalled()
  })

  test('warn when casting key in sequence to string', () => {
    process.emitWarning = jest.fn()
    const obj = YAML.parse('[ [foo]: bar ]')
    expect(obj).toMatchObject([{ '[ foo ]': 'bar' }])
    expect(process.emitWarning).toHaveBeenCalled()
  })
})

test('Document.toJS({ onAnchor })', () => {
  const src = 'foo: &a [&v foo]\nbar: *a\nbaz: *a\n'
  const doc = YAML.parseDocument(src)
  const onAnchor = jest.fn()
  const res = doc.toJS({ onAnchor })
  expect(onAnchor.mock.calls).toMatchObject([
    [res.foo, 3],
    ['foo', 1]
  ])
})

describe('__proto__ as mapping key', () => {
  test('plain object', () => {
    const src = '{ __proto__: [42] }'
    const obj = YAML.parse(src)
    expect(Array.isArray(obj)).toBe(false)
    expect({}.hasOwnProperty.call(obj, '__proto__')).toBe(true)
    expect(obj).not.toHaveProperty('length')
    expect(JSON.stringify(obj)).toBe('{"__proto__":[42]}')
  })

  test('with merge key', () => {
    const src = '- &A { __proto__: [42] }\n- { <<: *A }\n'
    const obj = YAML.parse(src, { merge: true })
    expect({}.hasOwnProperty.call(obj[0], '__proto__')).toBe(true)
    expect({}.hasOwnProperty.call(obj[1], '__proto__')).toBe(true)
    expect(JSON.stringify(obj)).toBe('[{"__proto__":[42]},{"__proto__":[42]}]')
  })
})

describe('keepSourceTokens', () => {
  test('default false', () => {
    const doc = YAML.parseDocument('foo: bar')
    expect(doc.contents).not.toHaveProperty('srcToken')
    expect(doc.get('foo', true)).not.toHaveProperty('srcToken')
  })

  test('included when set', () => {
    const doc = YAML.parseDocument('foo: bar', { keepSourceTokens: true })
    expect(doc.contents.srcToken).toMatchObject({ type: 'block-map' })
    expect(doc.get('foo', true).srcToken).toMatchObject({ type: 'scalar' })
  })

  test('allow for CST modifications (eemeli/yaml#903)', () => {
    const src = 'foo:\n  [ 42 ]'
    const tokens = Array.from(new YAML.Parser().parse(src))
    const docs = new YAML.Composer({ keepSourceTokens: true }).compose(tokens)
    const doc = Array.from(docs)[0]
    const node = doc.get('foo', true)
    YAML.CST.setScalarValue(node.srcToken, 'eek')
    const res = tokens.map(YAML.CST.stringify).join('')
    expect(res).toBe('foo:\n  eek')
  })
})

describe('reviver', () => {
  test('MDN exemple', () => {
    const reviver = jest.fn((_key, value) => value)
    const src = '{"1": 1, "2": 2, "3": {"4": 4, "5": {"6": 6}}}'
    const obj = JSON.parse(src)
    YAML.parse(src, reviver)
    expect(reviver.mock.calls).toMatchObject([
      ['1', 1],
      ['2', 2],
      ['4', 4],
      ['6', 6],
      ['5', { 6: 6 }],
      ['3', obj[3]],
      ['', obj]
    ])
    expect(reviver.mock.instances).toMatchObject([
      obj,
      obj,
      obj[3],
      obj[3][5],
      obj[3],
      obj,
      { '': obj }
    ])
  })

  test('modify values', () => {
    const reviver = jest.fn((_key, value) =>
      typeof value === 'number' ? 2 * value : value
    )
    const src = '{"1": 1, "2": 2, "3": {"4": 4, "5": {"6": 6}}}'
    expect(YAML.parse(src, reviver)).toMatchObject({
      1: 2,
      2: 4,
      3: { 4: 8, 5: { 6: 12 } }
    })
  })

  test('remove values', () => {
    const reviver = jest.fn((key, value) =>
      key !== '' && key % 2 === 0 ? undefined : value
    )
    const src = '{"1": 1, "2": 2, "3": {"4": 4, "5": {"6": 6}}}'
    expect(YAML.parse(src, reviver)).toMatchObject({
      1: 1,
      3: { 5: {} }
    })
  })

  test('add values to this', () => {
    const reviver = jest.fn(function (key, value) {
      expect(key).not.toBe('9')
      this[9] = 9
      return value
    })
    const src = '{"1": 1, "2": 2, "3": {"4": 4, "5": {"6": 6}}}'
    expect(YAML.parse(src, reviver)).toMatchObject({
      1: 1,
      2: 2,
      3: { 4: 4, 5: { 6: 6, 9: 9 }, 9: 9 },
      9: 9
    })
  })

  test('sequence', () => {
    const these = []
    const reviver = jest.fn(function (key, value) {
      these.push(Array.from(key === '' ? this[''] : this))
      if (key === '0') return undefined
      if (key === '3') return 10
      return value
    })
    const src = '[ 2, 4, 6, 8 ]'
    const seq = YAML.parse(src, reviver)
    expect(seq).toBeInstanceOf(Array)
    expect(seq).toMatchObject([undefined, 4, 6, 10])
    expect(reviver.mock.calls).toMatchObject([
      ['0', 2],
      ['1', 4],
      ['2', 6],
      ['3', 8],
      ['', {}]
    ])
    expect(these).toMatchObject([
      [2, 4, 6, 8],
      [undefined, 4, 6, 8],
      [undefined, 4, 6, 8],
      [undefined, 4, 6, 8],
      [undefined, 4, 6, 10]
    ])
  })

  test('!!set', () => {
    const these = []
    const reviver = jest.fn(function (key, value) {
      these.push(Array.from(key === '' ? this[''] : this))
      if (key === 2) return undefined
      if (key === 8) return 10
      return value
    })
    const src = '!!set { 2, 4, 6, 8 }'
    const set = YAML.parse(src, reviver)
    expect(set).toBeInstanceOf(Set)
    expect(Array.from(set)).toMatchObject([4, 6, 10])
    expect(reviver.mock.calls).toMatchObject([
      [2, 2],
      [4, 4],
      [6, 6],
      [8, 8],
      ['', {}]
    ])
    expect(these).toMatchObject([
      [2, 4, 6, 8],
      [4, 6, 8],
      [4, 6, 8],
      [4, 6, 8],
      [4, 6, 10]
    ])
  })

  test('!!omap', () => {
    const these = []
    const reviver = jest.fn(function (key, value) {
      these.push(Array.from(key === '' ? this[''] : this))
      if (key === 2) return undefined
      if (key === 8) return 10
      return value
    })
    const src = '!!omap [ 2: 3, 4: 5, 6: 7, 8: 9 ]'
    const map = YAML.parse(src, reviver)
    expect(map).toBeInstanceOf(Map)
    expect(Array.from(map)).toMatchObject([
      [4, 5],
      [6, 7],
      [8, 10]
    ])
    expect(reviver.mock.calls).toMatchObject([
      [2, 3],
      [4, 5],
      [6, 7],
      [8, 9],
      ['', map]
    ])
    expect(these).toMatchObject([
      [
        [2, 3],
        [4, 5],
        [6, 7],
        [8, 9]
      ],
      [
        [4, 5],
        [6, 7],
        [8, 9]
      ],
      [
        [4, 5],
        [6, 7],
        [8, 9]
      ],
      [
        [4, 5],
        [6, 7],
        [8, 9]
      ],
      [
        [4, 5],
        [6, 7],
        [8, 10]
      ]
    ])
  })
})

describe('CRLF line endings', () => {
  test('trailing space in double-quoted scalar', () => {
    const res = YAML.parse('"foo \r\nbar"')
    expect(res).toBe('foo bar')
  })

  test('escaped newline in double-quoted scalar', () => {
    const res = YAML.parse('"foo \\\r\nbar"')
    expect(res).toBe('foo bar')
  })
})
