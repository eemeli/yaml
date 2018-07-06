import fs from 'fs'
import path from 'path'

import YAML from '../src/index'
import { strOptions } from '../src/schema/_string'

const testDirs = fs
  .readdirSync(path.resolve(__dirname, 'yaml-test-suite'))
  .filter(dir => ['.git', 'meta', 'name', 'tags'].indexOf(dir) === -1)

const matchJson = (docs, json) => {
  if (!json) return
  const received = docs[0] ? docs.map(doc => doc.toJSON()) : null
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
  origFoldOptions = strOptions.fold
  strOptions.fold = {
    lineWidth: 20,
    minContentWidth: 0
  }
})

afterAll(() => {
  strOptions.fold = origFoldOptions
})

testDirs.forEach(dir => {
  const root = path.resolve(__dirname, 'yaml-test-suite', dir)
  const name = fs.readFileSync(path.resolve(root, '==='), 'utf8')
  const yaml = fs.readFileSync(path.resolve(root, 'in.yaml'), 'utf8')
  let json, error, outYaml
  try {
    json = fs.readFileSync(path.resolve(root, 'in.json'), 'utf8')
  } catch (e) {}
  try {
    fs.readFileSync(path.resolve(root, 'error'), 'utf8')
    error = true
  } catch (e) {}
  try {
    outYaml = fs.readFileSync(path.resolve(root, 'out.yaml'), 'utf8')
  } catch (e) {}
  if (!error && !json && !outYaml) return
  test(`${dir}: ${name}`, () => {
    const docs = YAML.parseAllDocuments(yaml)
    matchJson(docs, json)
    const errors = docs
      .map(doc => doc.errors)
      .filter(docErrors => docErrors.length > 0)
    if (error) {
      expect(errors).not.toHaveLength(0)
    } else {
      expect(errors).toHaveLength(0)
      const src2 =
        docs.map(doc => String(doc).replace(/\n$/, '')).join('\n...\n') + '\n'
      const docs2 = YAML.parseAllDocuments(src2)
      trace: name,
        '\nIN\n' + yaml,
        '\nJSON\n' + JSON.stringify(docs[0], null, '  '),
        '\n\nOUT\n' + src2,
        '\nOUT-JSON\n' + JSON.stringify(src2),
        '\nRE-JSON\n' + JSON.stringify(docs2[0], null, '  ')
      matchJson(docs2, json)
      if (outYaml) {
        const expDocs = YAML.parseAllDocuments(outYaml)
        const resJson = docs.map(doc => doc.toJSON())
        const expJson = expDocs.map(doc => doc.toJSON())
        expect(resJson).toMatchObject(expJson)
      }
    }
  })
})
