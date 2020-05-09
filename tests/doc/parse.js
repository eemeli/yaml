import fs from 'fs'
import path from 'path'
import YAML from '../../index.js'

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

  test('eemeli/yaml#97', () => {
    const doc = YAML.parseDocument('foo: !!float 3.0')
    expect(String(doc)).toBe('foo: !!float 3.0\n')
  })
})

describe('number types', () => {
  describe('asBigInt: false', () => {
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
      const doc = YAML.parseDocument(src, { version: '1.1' })
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
      const doc = YAML.parseDocument(src, { version: '1.2' })
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

  describe('asBigInt: true', () => {
    let prevAsBigInt
    beforeAll(() => {
      prevAsBigInt = YAML.scalarOptions.int.asBigInt
      YAML.scalarOptions.int.asBigInt = true
    })
    afterAll(() => {
      YAML.scalarOptions.int.asBigInt = prevAsBigInt
    })

    test('Version 1.1', () => {
      const src = `
- 0b10_10
- 0123
- -00
- 123_456
- 3.1e+2
- 5.1_2_3E-1
- 4.02`
      const doc = YAML.parseDocument(src, { version: '1.1' })
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
      const doc = YAML.parseDocument(src, { version: '1.2' })
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
  expect(doc.contents.items[0].key).toBeNull()
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
    expect(doc.toJSON()).toMatchObject({
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
    expect(String(doc)).toBe(src)
  })

  test('minimal', () => {
    const src = `
  - a
  - b:
    - c
  - d`
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toHaveLength(0)
    expect(docs[0].toJSON()).toMatchObject(['a', { b: ['c'] }, 'd'])
  })
})

describe('eemeli/yaml#l19', () => {
  test('map', () => {
    const src = 'a:\n  # 123'
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe('? a\n\n# 123\n')
  })

  test('seq', () => {
    const src = '- a: # 123'
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe('- ? a # 123\n')
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
  expect(() => YAML.parse(src2)).toThrow(
    'Indicator : missing in flow map entry'
  )
})

test('empty node should respect setOrigRanges()', () => {
  const cst = YAML.parseCST('\r\na: # 123\r\n')
  expect(cst).toHaveLength(1)
  expect(cst.setOrigRanges()).toBe(true)
  const doc = new YAML.Document({ keepCstNodes: true }).parse(cst[0])
  const empty = doc.contents.items[0].value.cstNode
  expect(empty.range).toEqual({ start: 3, end: 3, origStart: 4, origEnd: 4 })
})

test('parse an empty string as null', () => {
  const value = YAML.parse('')
  expect(value).toBeNull()
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
    expect(String(doc)).toBe(`? a\n? b #c\n`)
    doc.contents.items[1].value = 'x'
    expect(String(doc)).toBe(`a: null\n? b #c\n: x\n`)
  })

  test('flow map', () => {
    const src = `{\na: null,\n? b\n}`
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe(`{ a, b }\n`)
    doc.contents.items[1].comment = 'c'
    expect(String(doc)).toBe(`{\n  a,\n  b #c\n}\n`)
    doc.contents.items[1].value = 'x'
    expect(String(doc)).toBe(`{\n  a: null,\n  b: #c\n    x\n}\n`)
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

describe('handling complex keys', () => {
  let origEmitWarning
  beforeAll(() => {
    origEmitWarning = process.emitWarning
  })
  afterAll(() => {
    process.emitWarning = origEmitWarning
  })

  test('add warning to doc when casting key in collection to string', () => {
    const doc = YAML.parseDocument('[foo]: bar')
    const message =
      'Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.'
    expect(doc.warnings).toMatchObject([{ message }])
  })

  test('do not add warning when using mapIsMap: true', () => {
    const doc = YAML.parseDocument('[foo]: bar', { mapAsMap: true })
    expect(doc.warnings).toMatchObject([])
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

test('Document.toJSON(null, onAnchor)', () => {
  const src = 'foo: &a [&v foo]\nbar: *a\nbaz: *a\n'
  const doc = YAML.parseDocument(src)
  const onAnchor = jest.fn()
  const res = doc.toJSON(null, onAnchor)
  expect(onAnchor.mock.calls).toMatchObject([
    [res.foo, 3],
    ['foo', 1]
  ])
})
