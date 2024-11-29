import { readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'

import { CST, type Document, Lexer, parse, parseAllDocuments, Parser } from 'yaml'
import { testEvents } from '../src/test-events.ts' // no public export

type TestCase = {
  yaml: string
  fail?: boolean
  tree?: string
  json?: string
  emit?: string
  dump?: string
}

type TestFile = [TestCase & { name: string; skip?: boolean }, ...TestCase[]]

const skip: Record<string, boolean | string[]> = {
  '2JQS/0': ['test.event', 'errors'], // duplicate empty keys are invalid
  '9MMA/0': ['errors'], // allow stream with directive & no docs
  'SF5V/0': ['errors'] // allow duplicate %YAML directives
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

const unescape = (text: string) =>
  text
    .replace(/␣/g, ' ')
    .replace(/—*»/g, '\t')
    .replace(/←/g, '\r')
    .replace(/⇔/g, 'x{FEFF}')
    .replace(/↵/g, '')
    .replace(/∎\n/g, '')

const testRoot = resolve(__dirname, 'yaml-test-suite', 'src')

for (const fn of readdirSync(testRoot)) {
  const [id, ext] = fn.split('.', 2)
  if (ext !== 'yaml') {
    console.warn(`Not a test file, skipping: ${fn}`)
    continue
  }
  const path = resolve(testRoot, fn)
  const file = readFileSync(path, 'utf8')
  const testData = parse(file) as TestFile
  if (!Array.isArray(testData)) throw new Error(`Unsupported test file: ${fn}`)
  if (testData[0].skip) continue

  const name = `${id}: ${testData[0].name}`
  for (let i = 0; i < testData.length; ++i) {
    const sd = skip[`${id}/${i}`] || null
    const test_ = (name: string, cb: () => void) => {
      if (sd === true || sd?.includes(name)) test.skip(name, cb)
      else test(name, cb)
    }

    describe(testData.length === 1 ? name : `${name} / ${i}`, () => {
      const yaml = unescape(testData[i].yaml)
      const { fail, tree, json, emit } = testData[i]

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

      // Too much variance in event stream length for error cases
      if (!fail && tree) {
        test_('test.event', () => {
          const res = testEvents(yaml)
          const exp = unescape(tree).replace(/^\s+/gm, '')
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
          if (fail) expect(errors).not.toHaveLength(0)
          else expect(errors).toHaveLength(0)
        })

        if (!fail) {
          if (json) {
            test_('in.json', () => testJsonMatch(docs, json))

            test_('stringfy+re-parse', () => {
              const src2 = docs.map(String).join('')
              const docs2 = parseAllDocuments(src2, { resolveKnownTags: false })
              testJsonMatch(docs2, json)
            })
          }

          if (emit) {
            test_('out.yaml', () => {
              const resDocs = parseAllDocuments(yaml)
              const resJson = resDocs.map(doc => doc.toJS({ mapAsMap: true }))
              const expDocs = parseAllDocuments(unescape(emit))
              const expJson = expDocs.map(doc => doc.toJS({ mapAsMap: true }))
              expect(resJson).toEqual(expJson)
            })
          }
        }
      })
    })
  }
}
