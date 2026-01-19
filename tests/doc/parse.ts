import type { Mock } from 'vitest'
import * as YAML from 'yaml'
import { source } from '../_utils.ts'

let readArtifact
if (typeof window === 'undefined') {
  const { readFile } = await import('node:fs/promises')
  const { resolve } = await import('node:path')
  readArtifact = (path: string, opt?: string): Promise<string> =>
    // @ts-expect-error It's fine.
    readFile(resolve(__dirname, '..', 'artifacts', path), opt)
} else {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore -- @vitest/browser-playwright might not be installed
  const { commands } = await import('vitest/browser')
  readArtifact = (path: string, opt?: string): Promise<string> => {
    return opt === 'utf8'
      ? commands.readFile(`tests/artifacts/${path}`)
      : Promise.resolve(new Uint8Array() as any)
  }
}

describe('scalars', () => {
  test('empty block scalar at end of document', () => {
    const docs = YAML.parseAllDocuments('|\n---\nfoo')
    expect(docs.map(doc => doc.toJS())).toMatchObject(['', 'foo'])
  })

  test('carriage returns in double-quotes', () => {
    const src = '"a\nb\n\rc\n\r\nd\n\r\n\re\n\r\n\r\nf"'
    expect(YAML.parse(src)).toBe('a b\nc\nd\n\ne\n\nf')
  })
})

describe('indented block sequence (#10)', () => {
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

  test('complete file', async () => {
    const src = await readArtifact('prettier-circleci-config.yml', 'utf8')
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

test('buffer as source (#459)', async () => {
  const buffer = await readArtifact('prettier-circleci-config.yml')
  expect(() => YAML.parseDocument(buffer as any)).toThrow(
    'source is not a string'
  )
})

test('long scalar value in flow map (#36)', () => {
  expect(() => YAML.parse(`{ x: ${'x'.repeat(1024)} }`)).not.toThrow()
})

describe('flow collection keys', () => {
  test('block map with flow collection key as explicit key', () => {
    const doc = YAML.parseDocument(`? []: x`)
    expect(doc.errors).toHaveLength(0)
    expect(doc.contents).toMatchObject({
      items: [
        {
          key: {
            items: [{ key: { items: [], flow: true }, value: { value: 'x' } }]
          },
          value: null
        }
      ]
    })
  })

  test('flow collection as first block map key (redhat-developer/vscode-yaml#712)', () => {
    const doc = YAML.parseDocument(source`
      a:
        []: b
        c: d
    `)
    expect(doc.errors).toHaveLength(0)
    expect(doc.contents).toMatchObject({
      items: [
        {
          key: { value: 'a' },
          value: {
            items: [
              { key: { items: [] }, value: { value: 'b' } },
              { key: { value: 'c' }, value: { value: 'd' } }
            ]
          }
        }
      ]
    })
  })

  test('flow collection as second block map key (redhat-developer/vscode-yaml#712)', () => {
    const doc = YAML.parseDocument(source`
      x: y
      a:
        []: b
        c: d
    `)
    expect(doc.errors).toHaveLength(0)
    expect(doc.contents).toMatchObject({
      items: [
        { key: { value: 'x' }, value: { value: 'y' } },
        {
          key: { value: 'a' },
          value: {
            items: [
              { key: { items: [] }, value: { value: 'b' } },
              { key: { value: 'c' }, value: { value: 'd' } }
            ]
          }
        }
      ]
    })
  })

  test('empty scalar as last flow collection value (#550)', () => {
    const doc = YAML.parseDocument<YAML.YAMLMap, false>('{c:}')
    expect(doc.contents.items).toMatchObject([
      { key: { value: 'c' }, value: { value: null } }
    ])
  })

  test('plain key with no space before flow collection value (#550)', () => {
    const doc = YAML.parseDocument<YAML.YAMLMap, false>('{c:[]}')
    expect(doc.contents.items).toMatchObject([
      { key: { value: 'c' }, value: { items: [] } }
    ])
  })
})

test('indented block sequnce with inner block sequence (#38)', () => {
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

test('stream end after : indicator (#120)', () => {
  const src = `test:
    - test1: test1
      test2:`
  expect(YAML.parse(src)).toEqual({
    test: [{ test1: 'test1', test2: null }]
  })
})

test('comment between key & : in flow collection (#149)', () => {
  const src1 = '{"a"\n#c\n:1}'
  expect(YAML.parse(src1)).toEqual({ a: 1 })

  const src2 = '{a\n#c\n:1}'
  const doc = YAML.parseDocument(src2)
  expect(doc.errors).toMatchObject([{ code: 'MISSING_CHAR' }])
})

describe('indented key with anchor (#378)', () => {
  test('followed by value', () => {
    const src1 = '&a foo: 1\n&b bar: 2'
    expect(YAML.parse(src1)).toEqual({ foo: 1, bar: 2 })

    const src2 = ' &a foo: 3\n &b bar: 4'
    expect(YAML.parse(src2)).toEqual({ foo: 3, bar: 4 })
  })

  test('with : on separate line', () => {
    const src1 = 'a: 1\n&b\nc: 2'
    const doc1 = YAML.parseDocument(src1)
    expect(doc1.errors).toMatchObject([{ code: 'MULTILINE_IMPLICIT_KEY' }])

    const src2 = ' a: 1\n &b\n : 2'
    const doc2 = YAML.parseDocument(src2)
    expect(doc2.errors).toMatchObject([{ code: 'MULTILINE_IMPLICIT_KEY' }])
  })
})

describe('empty(ish) nodes', () => {
  test('empty explicit key (#3)', () => {
    const src = '{ ? : 123 }'
    const doc = YAML.parseDocument<any>(src)
    expect(doc.errors).toHaveLength(0)
    expect(doc.contents.items[0].key.value).toBeNull()
    expect(doc.contents.items[0].value.value).toBe(123)
  })

  describe('comment on empty pair value (#19)', () => {
    test('map', () => {
      const src = 'a:\n  # 123'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('a: # 123\n')
    })

    test('seq', () => {
      const src = '- a: # 123'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('- a: # 123\n')
    })
  })

  test('explicit key with empty value (#32)', () => {
    expect(YAML.parse('[ ? ]')).toEqual([{ '': null }])
    expect(YAML.parse('[? 123]')).toEqual([{ 123: null }])
    expect(YAML.parse('[ 123, ? ]')).toEqual([123, { '': null }])
    expect(YAML.parse('[ 123, ? 456 ]')).toEqual([123, { 456: null }])
  })

  describe('empty block scalars', () => {
    test('no body (#34)', () => {
      expect(YAML.parse('|')).toEqual('')
    })

    test('whitespace with indents (#313)', () => {
      expect(YAML.parse('|+\n   \n\n     \n')).toEqual('\n\n\n')
    })
  })

  test('empty node position', () => {
    const doc = YAML.parseDocument<any>('\r\na: # 123\r\n')
    const empty = doc.contents.items[0].value
    expect(empty.range).toEqual([5, 5, 12])
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
    const doc = YAML.parseDocument<any>(src)
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

  test('pair in flow seq has correct range (#573)', () => {
    const doc = YAML.parseDocument<any, false>('[a:]')
    expect(doc.range).toEqual([0, 4, 4])
    expect(doc.get(0).range).toEqual([1, 3, 3])
  })

  test('implicit scalar key after explicit key with no value', () => {
    const doc = YAML.parseDocument<YAML.YAMLMap, false>('? - 1\nx:\n')
    expect(doc.contents.items).toMatchObject([
      { key: { items: [{ value: 1 }] }, value: null },
      { key: { value: 'x' }, value: { value: null } }
    ])
  })

  test('implicit flow collection key after explicit key with no value', () => {
    const doc = YAML.parseDocument<YAML.YAMLMap, false>('? - 1\n[x]: y\n')
    expect(doc.contents.items).toMatchObject([
      { key: { items: [{ value: 1 }] }, value: null },
      { key: { items: [{ value: 'x' }] }, value: { value: 'y' } }
    ])
  })
})

describe('odd indentations', () => {
  test('Block map with empty explicit key (#551)', () => {
    const doc = YAML.parseDocument<YAML.YAMLMap, false>('?\n? a')
    expect(doc.errors).toHaveLength(0)
    expect(doc.contents.items).toMatchObject([
      { key: { value: null }, value: null },
      { key: { value: 'a' }, value: null }
    ])
  })

  test('Block map with unindented !!null explicit key', () => {
    const doc = YAML.parseDocument<YAML.YAMLMap, false>('?\n!!null')
    expect(doc.errors).not.toHaveLength(0)
  })

  test('unindented block scalar header in mapping value (#553)', () => {
    const doc = YAML.parseDocument<YAML.YAMLMap, false>('a:\n|\n x')
    expect(doc.errors).not.toHaveLength(0)
  })

  test('unindented flow collection in mapping value', () => {
    const doc = YAML.parseDocument<YAML.YAMLMap, false>('a:\n{x}')
    expect(doc.errors).not.toHaveLength(0)
  })

  test('comment after top-level block scalar with indentation indicator (#547)', () => {
    const doc = YAML.parseDocument<YAML.Scalar, false>('|1\n x\n#c')
    expect(doc.errors).toHaveLength(0)
    expect(doc.contents).toMatchObject({ value: 'x\n' })
  })

  test('tab after indent spaces for flow-in-block (#604)', () => {
    const doc = YAML.parseDocument<YAML.YAMLMap, false>('foo:\n \tbar')
    expect(doc.errors).toHaveLength(0)
    expect(doc.toJS()).toMatchObject({ foo: 'bar' })
  })
})

describe('Excessive entity expansion attacks', async () => {
  const src1 = await readArtifact('pr104/case1.yml', 'utf8')
  const src2 = await readArtifact('pr104/case2.yml', 'utf8')
  const srcB = await readArtifact('pr104/billion-laughs.yml', 'utf8')
  const srcQ = await readArtifact('pr104/quadratic.yml', 'utf8')

  describe('Limit count by default', () => {
    for (const [name, src] of [
      ['js-yaml case 1', src1],
      ['js-yaml case 2', src2],
      ['billion laughs', srcB],
      ['quadratic expansion', srcQ]
    ]) {
      test(name, () => {
        expect(() => YAML.parse(src, { logLevel: 'error' })).toThrow(
          /Excessive alias count/
        )
      })
    }
  })

  describe('Work sensibly even with disabled limits', () => {
    test('js-yaml case 1', () => {
      const mockWarn =
        typeof process !== 'undefined'
          ? vi.spyOn(process, 'emitWarning').mockImplementation(() => {})
          : vi.spyOn(console, 'warn').mockImplementation(() => {})
      const obj = YAML.parse(src1, { maxAliasCount: -1 })
      expect(obj).toMatchObject({})
      const key = Object.keys(obj)[0]
      expect(key.length).toBeGreaterThan(2000)
      expect(key.length).toBeLessThan(8000)
      expect(mockWarn).toHaveBeenCalled()
      mockWarn.mockRestore()
    })

    test('js-yaml case 2', () => {
      const arr = YAML.parse(src2, { logLevel: 'error', maxAliasCount: -1 })
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
  let mockWarn: Mock<(...data: any[]) => void>
  beforeAll(() => {
    mockWarn =
      typeof process !== 'undefined'
        ? vi.spyOn(global.process, 'emitWarning').mockImplementation(() => {})
        : vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  beforeEach(() => mockWarn.mockReset().mockImplementation(() => {}))
  afterAll(() => mockWarn.mockRestore())

  test('emit warning when casting key in collection to string as JS Object key', () => {
    const doc = YAML.parseDocument('[foo]: bar', { prettyErrors: false })
    expect(doc.warnings).toHaveLength(0)
    expect(mockWarn).not.toHaveBeenCalled()

    doc.toJS()
    expect(mockWarn).toHaveBeenCalledTimes(1)
    expect(mockWarn.mock.calls[0][0]).toMatch(
      /^Keys with collection values will be stringified due to JS Object restrictions/
    )
  })

  test('do not add warning when using mapIsMap: true', () => {
    const doc = YAML.parseDocument('[foo]: bar')
    doc.toJS({ mapAsMap: true })
    expect(doc.warnings).toMatchObject([])
    expect(mockWarn).not.toHaveBeenCalled()
  })

  test('warn when casting key in collection to string', () => {
    const obj = YAML.parse('[foo]: bar')
    expect(Object.keys(obj)).toMatchObject(['[ foo ]'])
    expect(mockWarn).toHaveBeenCalled()
  })

  test('warn when casting key in sequence to string', () => {
    const obj = YAML.parse('[ [foo]: bar ]')
    expect(obj).toMatchObject([{ '[ foo ]': 'bar' }])
    expect(mockWarn).toHaveBeenCalled()
  })

  test('Error on unresolved !!binary node with mapAsMap: false (#610)', () => {
    const doc = YAML.parseDocument('? ? !!binary ? !!binary')
    expect(doc.warnings).toMatchObject([{ code: 'BAD_COLLECTION_TYPE' }])
    doc.toJS()
    expect(mockWarn).toHaveBeenCalled()
  })

  test('Error on unresolved !!timestamp node with mapAsMap: false (#610)', () => {
    const doc = YAML.parseDocument(
      '? ? !!timestamp ? !!timestamp 2025-03-15T15:35:58.586Z'
    )
    expect(doc.warnings).toMatchObject([{ code: 'BAD_COLLECTION_TYPE' }])
    doc.toJS()
    expect(mockWarn).toHaveBeenCalled()
  })
})

test('Document.toJS({ onAnchor })', () => {
  const src = 'foo: &a [&v foo]\nbar: *a\nbaz: *a\n'
  const doc = YAML.parseDocument(src)
  const onAnchor = vi.fn()
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
  for (const [src, type] of [
    ['foo: bar', 'block-map'],
    ['{ foo: bar }', 'flow-collection']
  ]) {
    test(`${type}: default false`, () => {
      const doc = YAML.parseDocument<any>(src)
      expect(doc.contents).not.toHaveProperty('srcToken')
      expect(doc.contents.items[0]).not.toHaveProperty('srcToken')
      expect(doc.get('foo', true)).not.toHaveProperty('srcToken')
    })

    test(`${type}: included when set`, () => {
      const doc = YAML.parseDocument<any, false>(src, {
        keepSourceTokens: true
      })
      expect(doc.contents.srcToken).toMatchObject({ type })
      expect(doc.contents.items[0].srcToken).toMatchObject({
        key: { type: 'scalar' },
        value: { type: 'scalar' }
      })
      expect(doc.get('foo', true).srcToken).toMatchObject({ type: 'scalar' })
    })
  }

  test('allow for CST modifications (#903)', () => {
    const src = 'foo:\n  [ 42 ]'
    const tokens = Array.from(new YAML.Parser().parse(src))
    const docs = new YAML.Composer<YAML.ParsedNode, false>({
      keepSourceTokens: true
    }).compose(tokens)
    const doc = Array.from(docs)[0]
    const node = doc.get('foo', true)
    YAML.CST.setScalarValue(node.srcToken, 'eek')
    const res = tokens.map(YAML.CST.stringify).join('')
    expect(res).toBe('foo:\n  eek')
  })
})

describe('reviver', () => {
  test('MDN exemple', () => {
    const reviver = vi.fn((_key, value) => value)
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
    const reviver = vi.fn((_key, value) =>
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
    const reviver = vi.fn((key, value) =>
      key !== '' && key % 2 === 0 ? undefined : value
    )
    const src = '{"1": 1, "2": 2, "3": {"4": 4, "5": {"6": 6}}}'
    expect(YAML.parse(src, reviver)).toMatchObject({
      1: 1,
      3: { 5: {} }
    })
  })

  test('add values to this', () => {
    const reviver = vi.fn(function (this: any, key, value) {
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
    const these: unknown[][] = []
    const reviver = vi.fn(function (this: any, key, value) {
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
    const these: unknown[][] = []
    const reviver = vi.fn(function (this: any, key, value) {
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
    const these: unknown[][] = []
    const reviver = vi.fn(function (this: any, key, value) {
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

describe('stringKeys', () => {
  test('success', () => {
    const doc = YAML.parseDocument<any>(
      source`
        x: x
        !!str y: y
        42: 42
        true: true
        null: null
        ~: ~
        :
      `,
      { stringKeys: true }
    )
    expect(doc.contents.items).toMatchObject([
      { key: { value: 'x' }, value: { value: 'x' } },
      { key: { value: 'y' }, value: { value: 'y' } },
      { key: { value: '42' }, value: { value: 42 } },
      { key: { value: 'true' }, value: { value: true } },
      { key: { value: 'null' }, value: { value: null } },
      { key: { value: '~' }, value: { value: null } },
      { key: { value: '' }, value: { value: null } }
    ])
  })

  test('explicit non-string tag', () => {
    const doc = YAML.parseDocument('!!int 42: 42', { stringKeys: true })
    expect(doc.errors).toMatchObject([{ code: 'NON_STRING_KEY' }])
  })

  test('collection key', () => {
    const doc = YAML.parseDocument('{ x, y }: 42', { stringKeys: true })
    expect(doc.errors).toMatchObject([{ code: 'NON_STRING_KEY' }])
  })
})

describe('standalone CR line break handling (#595)', () => {
  describe('basic document parsing', () => {
    test('CR-separated key-value pairs', () => {
      expect(YAML.parse('a: 1\rb: 2\rc: 3')).toEqual({ a: 1, b: 2, c: 3 })
    })

    test('CR produces same result as LF', () => {
      const crDoc = 'a: 1\rb: 2'
      const lfDoc = 'a: 1\nb: 2'
      expect(YAML.parse(crDoc)).toEqual(YAML.parse(lfDoc))
    })

    test('mixed CR, LF, and CRLF line breaks', () => {
      expect(YAML.parse('a: 1\rb: 2\nc: 3\r\nd: 4')).toEqual({
        a: 1,
        b: 2,
        c: 3,
        d: 4
      })
    })

    test('CR in block sequence', () => {
      expect(YAML.parse('- a\r- b\r- c')).toEqual(['a', 'b', 'c'])
    })

    test('CR at end of document', () => {
      expect(YAML.parse('foo: bar\r')).toEqual({ foo: 'bar' })
    })
  })

  describe('double-quoted strings', () => {
    test('unescaped CR folds to space', () => {
      expect(YAML.parse('"a\rb"')).toBe('a b')
    })

    test('multiple unescaped CRs fold to newlines', () => {
      expect(YAML.parse('"a\r\rb"')).toBe('a\nb')
      expect(YAML.parse('"a\r\r\rb"')).toBe('a\n\nb')
    })

    test('CR matches LF folding behavior', () => {
      expect(YAML.parse('"a\rb"')).toBe(YAML.parse('"a\nb"'))
      expect(YAML.parse('"a\r\rb"')).toBe(YAML.parse('"a\n\nb"'))
    })

    test('escaped CR is line continuation', () => {
      expect(YAML.parse('"a\\\rb"')).toBe('ab')
      expect(YAML.parse('"a\\\r  b"')).toBe('ab') // trims following whitespace
    })

    test('escaped CR matches escaped LF behavior', () => {
      expect(YAML.parse('"a\\\rb"')).toBe(YAML.parse('"a\\\nb"'))
    })
  })

  describe('single-quoted strings', () => {
    test('CR folds to space in single-quoted string', () => {
      expect(YAML.parse("'a\rb'")).toBe('a b')
    })

    test('multiple CRs fold correctly', () => {
      expect(YAML.parse("'a\r\rb'")).toBe('a\nb')
    })
  })

  describe('block scalars', () => {
    test('literal block scalar with CR', () => {
      expect(YAML.parse('|\ra\rb')).toBe('a\nb\n')
    })

    test('folded block scalar with CR', () => {
      expect(YAML.parse('>\ra\rb')).toBe('a b\n')
    })

    test('block scalar content with CR line breaks', () => {
      expect(YAML.parse('|\r  line1\r  line2')).toBe('line1\nline2\n')
    })
  })

  describe('flow collections', () => {
    test('CR in flow sequence', () => {
      expect(YAML.parse('[\r1\r,\r2\r]')).toEqual([1, 2])
    })

    test('CR in flow mapping', () => {
      expect(YAML.parse('{\ra: 1\r,\rb: 2\r}')).toEqual({ a: 1, b: 2 })
    })
  })

  describe('comments', () => {
    test('CR before comment', () => {
      expect(YAML.parse('foo\r# comment')).toBe('foo')
    })

    test('CR after comment', () => {
      expect(YAML.parse('a: 1 # comment\rb: 2')).toEqual({ a: 1, b: 2 })
    })
  })

  describe('LF followed by CR (\\n\\r)', () => {
    test('\\n\\r is two separate line breaks', () => {
      // \n\r = LF + CR = two line breaks, folds to one newline
      expect(YAML.parse('"a\n\rb"')).toBe('a\nb')
    })

    test('\\n\\r in document structure', () => {
      expect(YAML.parse('a: 1\n\rb: 2')).toEqual({ a: 1, b: 2 })
    })
  })
})
