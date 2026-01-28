import { Readable } from 'stream'
import { cli } from 'yaml/cli'

const [major] = process.versions.node.split('.')
const skip = Number(major) < 20

;(skip ? describe.skip : describe)('CLI', () => {
  const stdout: unknown[] = []
  const stderr: unknown[] = []
  beforeAll(() => {
    vi.spyOn(global.console, 'log').mockImplementation(thing => {
      stdout.push(thing)
    })
    vi.spyOn(global.console, 'dir').mockImplementation(thing => {
      stdout.push(thing)
    })
    vi.spyOn(global.console, 'error').mockImplementation(thing => {
      stderr.push(thing)
    })
  })

  function ok(
    name: string,
    input: string,
    args: string[],
    output: unknown[],
    errors: unknown[] = []
  ) {
    test(
      name,
      () =>
        new Promise(done => {
          stdout.length = 0
          stderr.length = 0
          cli(
            Readable.from([input]),
            error => {
              try {
                expect(stdout).toMatchObject(output)
                expect(stderr).toMatchObject(errors)
                expect(error).toBeUndefined()
              } finally {
                done(undefined)
              }
            },
            args
          ).catch(done)
        })
    )
  }

  function fail(
    name: string,
    input: string,
    args: string[],
    errors: unknown[]
  ) {
    test(
      name,
      () =>
        new Promise(done => {
          stderr.length = 0
          let doned = false
          cli(
            Readable.from([input]),
            error => {
              if (doned) return
              try {
                expect(stderr).toMatchObject(errors)
                expect(error).not.toBeUndefined()
              } finally {
                done(undefined)
                doned = true
              }
            },
            args
          ).catch(done)
        })
    )
  }

  describe('Bad arguments', () => {
    fail('command', '42', ['nonesuch'], [])
    fail('option', '42', ['--nonesuch'], [])
  })

  describe('Stream processing', () => {
    ok('empty', '', [], [])
    ok('basic', 'hello: world', [], ['hello: world'])
    ok('valid ok', 'hello: world', ['valid'], [])
    fail('valid fail', 'hello: world: 2', ['valid'], [])
    ok(
      'multiple',
      'hello: world\n---\n42',
      [],
      ['hello: world', '...', '---\n42']
    )
    ok(
      'warn',
      'hello: !foo world',
      [],
      ['hello: !foo world'],
      [{ name: 'YAMLWarning' }]
    )
    fail('error', 'hello: world: 2', [], [{ name: 'YAMLParseError' }])
    fail('--single + empty', '', ['--single'], [])
    fail('--single + multiple', 'hello: world\n---\n42', ['--single'], [])
    describe('--json', () => {
      ok('basic', 'hello: world', ['--json'], ['[{"hello":"world"}]'])
      ok(
        '--single',
        'hello: world',
        ['--json', '--single'],
        ['{"hello":"world"}']
      )
      ok(
        'multiple',
        'hello: world\n---\n42',
        ['--json'],
        ['[{"hello":"world"},42]']
      )
    })
    describe('--indent', () => {
      ok(
        'basic',
        'hello:\n  world: 2',
        ['--indent', '3'],
        ['hello:\n   world: 2']
      )
      ok(
        '--json',
        'hello: world',
        ['--json', '--indent', '2'],
        ['[\n  {\n    "hello": "world"\n  }\n]']
      )
      ok(
        '--single',
        'hello: world',
        ['--json', '--indent', '2', '--single'],
        ['{\n  "hello": "world"\n}']
      )
      ok(
        'multiple',
        'hello: world\n---\n42',
        ['--json', '--indent', '2'],
        ['[\n  {\n    "hello": "world"\n  },\n  42\n]']
      )
      ok(
        'Lexer',
        'hello: world',
        ['lex', '--json', '--indent', '2'],
        [
          '[\n  "\\u0002",\n  "\\u001f",\n  "hello",\n  ":",\n  " ",\n  "\\u001f",\n  "world"\n]'
        ]
      )
      ok(
        'CST parser',
        'hello: world\n',
        ['cst', '--json', '--indent', '2'],
        [
          JSON.stringify(
            [
              {
                type: 'document',
                offset: 0,
                start: [],
                value: {
                  type: 'block-map',
                  offset: 0,
                  indent: 0,
                  items: [
                    {
                      start: [],
                      key: {
                        type: 'scalar',
                        offset: 0,
                        indent: 0,
                        source: 'hello'
                      },
                      sep: [
                        {
                          type: 'map-value-ind',
                          offset: 5,
                          indent: 0,
                          source: ':'
                        },
                        {
                          type: 'space',
                          offset: 6,
                          indent: 0,
                          source: ' '
                        }
                      ],
                      value: {
                        type: 'scalar',
                        offset: 7,
                        indent: 0,
                        source: 'world',
                        end: [
                          {
                            type: 'newline',
                            offset: 12,
                            indent: 0,
                            source: '\n'
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ],
            null,
            2
          )
        ]
      )
    })
    describe('--merge', () => {
      ok(
        'can be set',
        'hello:\n  world: 2\nfoo:\n  world: 2',
        ['--merge', '--json'],
        ['[{"hello":{"world":2},"foo":{"world":2}}]']
      )
      ok(
        'basic',
        'hello: &a\n  world: 2\nfoo:\n  <<: *a',
        ['--merge', '--json'],
        ['[{"hello":{"world":2},"foo":{"world":2}}]']
      )
      ok(
        'also enabled with --yaml=1.1',
        'hello: &a\n  world: 2\nfoo:\n  <<: *a',
        ['--yaml=1.1', '--json'],
        ['[{"hello":{"world":2},"foo":{"world":2}}]']
      )
      ok(
        'not enabled by default',
        'hello: &a\n  world: 2\nfoo:\n  <<: *a',
        ['--json'],
        ['[{"hello":{"world":2},"foo":{"<<":{"world":2}}}]']
      )
    })
    describe('--doc', () => {
      ok('basic', 'hello: world', ['--doc'], [{ value: { items: [{}] } }])
      ok(
        'multiple',
        'hello: world\n---\n42',
        ['--doc'],
        [{ value: { items: [{}] } }, { value: { value: 42 } }]
      )
      ok(
        'error',
        'hello: world: 2',
        ['--doc'],
        [{ value: { items: [{}] } }],
        [{ name: 'YAMLParseError' }]
      )
    })
    describe('--visit', () => {
      ok(
        'unstyle',
        '{"hello":"world"}',
        ['--visit', './tests/artifacts/cli-unstyle.cjs'],
        ['hello: world']
      )
      ok(
        'singlequote',
        '{"hello":"world"}',
        ['--visit', './tests/artifacts/cli-singlequote.js'],
        ["{ 'hello': 'world' }"]
      )
    })
  })

  describe('CST parser', () => {
    ok('basic', 'hello: world', ['cst'], [{ type: 'document' }])
    ok(
      'multiple',
      'hello: world\n---\n42',
      ['cst'],
      [{ type: 'document' }, { type: 'document' }]
    )
  })

  describe('Lexer', () => {
    ok(
      'basic',
      'hello: world',
      ['lex'],
      ['<DOC>', '<SCALAR>', '"hello"', '":"', '" "', '<SCALAR>', '"world"']
    )
    ok(
      '--json',
      'hello: world',
      ['lex', '--json'],
      ['["\\u0002","\\u001f","hello",":"," ","\\u001f","world"]']
    )
  })
})
