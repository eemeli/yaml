import fs from 'fs'
import path from 'path'

import * as YAML from '../index.js'
import { testEvents } from '../dist/test-events.js'

const testDirs = fs
  .readdirSync(path.resolve(__dirname, 'yaml-test-suite'))
  .filter(dir => /^[A-Z0-9]{4}$/.test(dir))

const matchJson = (docs, json) => {
  if (!json) return
  const received = docs[0] ? docs.map(doc => doc.toJS()) : null
  const expected =
    docs.length > 1
      ? json
          .replace(/\n$/, '')
          .split('\n')
          .map(line => JSON.parse(line))
      : [JSON.parse(json)]
  if (!received || typeof received !== 'object') {
    expect(received).toBe(expected)
  } else {
    expect(received).toMatchObject(expected)
  }
}

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

testDirs.forEach(dir => {
  const root = path.resolve(__dirname, 'yaml-test-suite', dir)
  const name = fs.readFileSync(path.resolve(root, '==='), 'utf8').trim()
  const yaml = fs.readFileSync(path.resolve(root, 'in.yaml'), 'utf8')
  let error, events, json, outYaml
  try {
    fs.readFileSync(path.resolve(root, 'error'), 'utf8')
    error = true
  } catch (e) {
    /* ignore error */
  }
  try {
    // Too much variance in event stream length for error cases
    events = !error && fs.readFileSync(path.resolve(root, 'test.event'), 'utf8')
  } catch (e) {
    /* ignore error */
  }
  try {
    json = fs.readFileSync(path.resolve(root, 'in.json'), 'utf8')
  } catch (e) {
    /* ignore error */
  }
  try {
    outYaml = fs.readFileSync(path.resolve(root, 'out.yaml'), 'utf8')
  } catch (e) {
    /* ignore error */
  }

  describe(`${dir}: ${name}`, () => {
    const docs = YAML.parseAllDocuments(yaml, { resolveKnownTags: false })
    if (events) {
      test('test.event', () => {
        const res = testEvents(yaml)
        expect(res.events.join('\n') + '\n').toBe(events)
        expect(res.error).toBeNull()
      })
    }
    if (json) test('in.json', () => matchJson(docs, json))
    test('errors', () => {
      const errors = docs
        .map(doc => doc.errors)
        .filter(docErrors => docErrors.length > 0)
      if (error) {
        expect(errors).not.toHaveLength(0)
      } else {
        expect(errors).toHaveLength(0)
      }
    })
    if (!error) {
      const src2 =
        docs.map(doc => String(doc).replace(/\n$/, '')).join('\n...\n') + '\n'
      const docs2 = YAML.parseAllDocuments(src2, { resolveKnownTags: false })
      trace: name,
        '\nIN\n' + yaml,
        '\nJSON\n' + JSON.stringify(docs[0], null, '  '),
        '\n\nOUT\n' + src2,
        '\nOUT-JSON\n' + JSON.stringify(src2),
        '\nRE-JSON\n' + JSON.stringify(docs2[0], null, '  ')

      if (json) test('stringfy+re-parse', () => matchJson(docs2, json))

      if (outYaml) {
        test('out.yaml', () => {
          const resDocs = YAML.parseAllDocuments(yaml, { mapAsMap: true })
          const resJson = resDocs.map(doc => doc.toJS())
          const expDocs = YAML.parseAllDocuments(outYaml, { mapAsMap: true })
          const expJson = expDocs.map(doc => doc.toJS())
          expect(resJson).toMatchObject(expJson)
        })
      }
    }
  })
})
