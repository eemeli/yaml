import fs from 'fs'
import path from 'path'

import { YAMLWarning } from '../src/errors'
import resolve from '../src/index'

const testDirs = fs.readdirSync(path.resolve(__dirname, 'yaml-test-suite'))
  .filter(dir => ['.git', 'meta', 'name', 'tags'].indexOf(dir) === -1)

const matchJson = (stream, json) => {
  if (!json) return
  const received = stream[0] ? stream[0].toJSON() : null
  const expected = JSON.parse(json)
  if (!received || typeof received !== 'object') {
    expect(received).toBe(expected)
  } else {
    expect(received).toMatchObject(expected)
  }
}

const skipOutYaml = [
  '4ABK',
  '5WE3',
  '6BFJ',
  '7T8X',
  'RTP8',
  'WZ62'
]

testDirs.forEach(dir => {
  const root = path.resolve(__dirname, 'yaml-test-suite', dir)
  const name = fs.readFileSync(path.resolve(root, '==='), 'utf8')
  const yaml = fs.readFileSync(path.resolve(root, 'in.yaml'), 'utf8')
  let json, error, outYaml
  try { json = fs.readFileSync(path.resolve(root, 'in.json'), 'utf8') } catch (e) {}
  try { fs.readFileSync(path.resolve(root, 'error'), 'utf8'); error = true } catch (e) {}
  try { outYaml = fs.readFileSync(path.resolve(root, 'out.yaml'), 'utf8') } catch (e) {}
  if (!error && !json && !outYaml) return
  test(`${dir}: ${name}`, () => {
    const stream = resolve(yaml)
    matchJson(stream, json)
    if (error) {
      //expect(stream[0].errors).not.toHaveLength(0)
    } else {
      const errors = stream
        .map(doc => doc.errors.filter(err => !(err instanceof YAMLWarning)))
        .filter(docErrors => docErrors.length > 0)
      expect(errors).toHaveLength(0)
      const src2 = stream.map(doc => String(doc).replace(/\n$/, '')).join('\n---\n') + '\n'
      const stream2 = resolve(src2)
      trace: name,
        '\nIN\n' + yaml,
        '\nJSON\n' + JSON.stringify(stream[0], null, '  '),
        '\n\nOUT\n' + src2,
        '\nOUT-JSON\n' + JSON.stringify(src2),
        '\nRE-JSON\n' + JSON.stringify(stream2[0], null, '  ')
      matchJson(stream2, json)
      if (outYaml && !skipOutYaml.includes(dir)) {
        const expStream = resolve(outYaml)
        const resJson = stream.map(doc => doc.toJSON())
        const expJson = expStream.map(doc => doc.toJSON())
        expect(resJson).toMatchObject(expJson)
      }
    }
  })
})
