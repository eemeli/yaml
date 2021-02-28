import fs from 'fs'
import path from 'path'

import * as YAML from 'yaml'
import { testEvents } from 'yaml/test-events'

const skip = {
  B63P: ['errors'], // allow ... after directives
  SF5V: ['errors'] // allow duplicate %YAML directives
}

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

  function _test(name, cb) {
    const sd = skip[dir]
    if (sd === true || (sd && sd.includes(name))) test.skip(name, cb)
    else test(name, cb)
  }

  describe(`${dir}: ${name}`, () => {
    const docs = YAML.parseAllDocuments(yaml, { resolveKnownTags: false })
    if (events) {
      _test('test.event', () => {
        const res = testEvents(yaml)
        expect(res.events.join('\n') + '\n').toBe(events)
        expect(res.error).toBeNull()
      })
    }
    if (json) _test('in.json', () => matchJson(docs, json))
    _test('errors', () => {
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

      if (json) _test('stringfy+re-parse', () => matchJson(docs2, json))

      if (outYaml) {
        _test('out.yaml', () => {
          const resDocs = YAML.parseAllDocuments(yaml)
          const resJson = resDocs.map(doc => doc.toJS({ mapAsMap: true }))
          const expDocs = YAML.parseAllDocuments(outYaml)
          const expJson = expDocs.map(doc => doc.toJS({ mapAsMap: true }))
          expect(resJson).toMatchObject(expJson)
        })
      }
    }
  })
})
