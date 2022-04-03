import { existsSync, readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

import { CST, Document, Lexer, parseAllDocuments, Parser } from 'yaml'
import { testEvents } from '../src/test-events' // no public export

const skip: Record<string, boolean | string[]> = {
  '9MMA': ['errors'], // allow stream with directive & no docs
  SF5V: ['errors'], // allow duplicate %YAML directives

  // FIXME recent upstream additions
  'DK95/00': true,
  'DK95/04': true,
  'DK95/05': true,
  'Y79Y/004': ['errors'],
  'Y79Y/005': ['errors'],
  'Y79Y/006': ['errors'],
  'Y79Y/007': ['errors'],
  'Y79Y/008': ['errors'],
  'Y79Y/009': ['errors']
}

function testJsonMatch(docs: Document[], json: string) {
  if (!json) return
  const received = docs[0] ? docs.map(doc => doc.toJS()) : null
  const expected =
    docs.length > 1
      ? json
          .replace(/\n$/, '')
          .split('\n')
          .map(line => JSON.parse(line))
      : [JSON.parse(json)]
  expect(received).toEqual(expected)
}

const testRoot = resolve(__dirname, 'yaml-test-suite')
const testDirs = readdirSync(testRoot).filter(dir => /^[A-Z0-9]{4}$/.test(dir))
for (let i = testDirs.length - 1; i >= 0; --i) {
  const dir = testDirs[i]
  const contents = readdirSync(resolve(testRoot, dir))
  if (contents.every(cd => /^[0-9]+$/.test(cd))) {
    const subs = contents.map(cd => join(dir, cd))
    testDirs.splice(i, 1, ...subs)
  }
}

for (const dir of testDirs) {
  const load = (filename: string) => {
    const path = resolve(testRoot, dir, filename)
    try {
      return readFileSync(path, 'utf8')
    } catch (_) {
      return ''
    }
  }
  const test_ = (name: string, cb: () => void) => {
    const sd = skip[dir.replace('\\', '/')] || null
    if (sd === true || sd?.includes(name)) test.skip(name, cb)
    else test(name, cb)
  }

  const name = load('===').trim()
  describe(`${dir}: ${name}`, () => {
    const yaml = load('in.yaml')
    test('lexer completes', () => {
      let n = 0
      for (const lex of new Lexer().lex(yaml.replace(/(?<!\r)\n/g, '\r\n'))) {
        expect(typeof lex).toBe('string')
        if (++n === 9000) throw new Error('Lexer should produce fewer tokens')
      }
    })

    test('cst stringify', () => {
      let res = ''
      for (const tok of new Parser().parse(yaml)) res += CST.stringify(tok)
      expect(res).toBe(yaml)
    })

    const error = existsSync(resolve(testRoot, dir, 'error'))
    const events = error ? '' : load('test.event') // Too much variance in event stream length for error cases
    if (events) {
      test_('test.event', () => {
        const res = testEvents(yaml)
        const exp = events.replace(/\r\n/g, '\n')
        expect(res.events.join('\n') + '\n').toBe(exp)
        expect(res.error).toBeNull()
      })
    }

    describe('document parsing', () => {
      let docs: Document.Parsed[]
      beforeAll(() => {
        docs = parseAllDocuments(yaml, { resolveKnownTags: false })
      })

      test_('errors', () => {
        let errors: Error[] = []
        for (const doc of docs) errors = errors.concat(doc.errors)
        if (error) {
          expect(errors).not.toHaveLength(0)
        } else {
          expect(errors).toHaveLength(0)
        }
      })

      if (!error) {
        const json = load('in.json')
        if (json) {
          test_('in.json', () => testJsonMatch(docs, json))

          test_('stringfy+re-parse', () => {
            const src2 = docs.map(String).join('')
            const docs2 = parseAllDocuments(src2, { resolveKnownTags: false })
            testJsonMatch(docs2, json)
          })
        }

        const outYaml = load('out.yaml')
        if (outYaml) {
          test_('out.yaml', () => {
            const resDocs = parseAllDocuments(yaml)
            const resJson = resDocs.map(doc => doc.toJS({ mapAsMap: true }))
            const expDocs = parseAllDocuments(outYaml)
            const expJson = expDocs.map(doc => doc.toJS({ mapAsMap: true }))
            expect(resJson).toEqual(expJson)
          })
        }
      }
    })
  })
}
