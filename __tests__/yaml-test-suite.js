import fs from 'fs'
import path from 'path'

import { YAMLWarning } from '../src/errors'
import resolve from '../src/index'

const testDirs = fs.readdirSync(path.resolve(__dirname, 'yaml-test-suite'))
  .filter(dir => ['.git', 'meta', 'name', 'tags'].indexOf(dir) === -1)

testDirs.forEach(dir => {
  const root = path.resolve(__dirname, 'yaml-test-suite', dir)
  const name = fs.readFileSync(path.resolve(root, '==='), 'utf8')
  const yaml = fs.readFileSync(path.resolve(root, 'in.yaml'), 'utf8')
  let json, error
  try { json = fs.readFileSync(path.resolve(root, 'in.json'), 'utf8') } catch (e) {}
  try { fs.readFileSync(path.resolve(root, 'error'), 'utf8'); error = true } catch (e) {}
  if (!error && !json) return
  test(`${dir}: ${name}`, () => {
    const stream = resolve(yaml)
    if (json) {
      const received = stream[0].toJSON()
      const expected = JSON.parse(json)
      if (!received || typeof received !== 'object') {
        expect(received).toBe(expected)
      } else {
        expect(received).toMatchObject(expected)
      }
    }
    if (error) {
      expect(stream[0].errors).not.toHaveLength(0)
    } else {
      const errors = stream[0].errors.filter(err => !(err instanceof YAMLWarning))
      expect(errors).toHaveLength(0)
    }
  })
})
