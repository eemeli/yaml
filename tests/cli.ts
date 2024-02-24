/* eslint-disable @typescript-eslint/no-floating-promises */

import { Readable } from 'node:stream'
import { main } from 'yaml/cli'

const [major] = process.versions.node.split('.')
const skip = Number(major) < 20

;(skip ? describe.skip : describe)('CLI', () => {
  const stdout: unknown[] = []
  const stderr: unknown[] = []
  beforeAll(() => {
    jest.spyOn(global.console, 'log').mockImplementation(thing => {
      stdout.push(thing)
    })
    jest.spyOn(global.console, 'dir').mockImplementation(thing => {
      stdout.push(thing)
    })
    jest.spyOn(global.console, 'error').mockImplementation(thing => {
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
    test(name, done => {
      stdout.length = 0
      stderr.length = 0
      main(
        Readable.from([input]),
        error => {
          try {
            expect(stdout).toMatchObject(output)
            expect(stderr).toMatchObject(errors)
            expect(error).toBeUndefined()
          } finally {
            done()
          }
        },
        args
      )
    })
  }

  function fail(
    name: string,
    input: string,
    args: string[],
    errors: unknown[]
  ) {
    test(name, done => {
      stderr.length = 0
      let doned = false
      main(
        Readable.from([input]),
        error => {
          if (doned) return
          try {
            expect(stderr).toMatchObject(errors)
            expect(error).not.toBeUndefined()
          } finally {
            done()
            doned = true
          }
        },
        args
      )
    })
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
    describe('--doc', () => {
      ok('basic', 'hello: world', ['--doc'], [{ contents: { items: [{}] } }])
      ok(
        'multiple',
        'hello: world\n---\n42',
        ['--doc'],
        [{ contents: { items: [{}] } }, { contents: { value: 42 } }]
      )
      ok(
        'error',
        'hello: world: 2',
        ['--doc'],
        [{ contents: { items: [{}] } }],
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
        ['--visit', './tests/artifacts/cli-singlequote.mjs'],
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
