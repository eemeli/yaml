/* eslint-disable @typescript-eslint/no-empty-function */

import { readdirSync, readFileSync } from 'fs'
import { basename, resolve } from 'path'
import { parseDocument } from 'yaml'

const skip = [
  // Maximum call stack size exceeded
  'n_structure_100000_opening_arrays',
  'n_structure_open_array_object',

  // YAMLParseError: Map keys must be unique
  'y_object_duplicated_key',
  'y_object_duplicated_key_and_value',
  'object_same_key_different_values',
  'object_same_key_same_value',
  'object_same_key_unclear_values'
]

function testReject(name: string, src: string) {
  if (skip.includes(name)) return test.skip(name, () => {})

  test(name, () => {
    const doc = parseDocument(src)
    if (doc.errors.length === 0) {
      const res = doc.toJS()
      const doc2 = parseDocument(doc.toString())
      const res2 = doc2.toJS()
      expect(JSON.stringify(res2)).toBe(JSON.stringify(res))
    }
  })
}

function testSuccess(name: string, src: string) {
  if (skip.includes(name)) return test.skip(name, () => {})

  test(name, () => {
    const doc = parseDocument(src)
    expect(doc.errors).toHaveLength(0)
    expect(doc.warnings).toHaveLength(0)
    const res = doc.toJS()

    const doc2 = parseDocument(doc.toString())
    expect(doc2.errors).toHaveLength(0)
    expect(doc2.warnings).toHaveLength(0)
    const res2 = doc2.toJS()

    expect(JSON.stringify(res2)).toBe(JSON.stringify(res))
  })
}

describe('json-test-suite test_parsing', () => {
  const dir = resolve(__dirname, 'json-test-suite', 'test_parsing')
  for (const fn of readdirSync(dir)) {
    if (!fn.endsWith('.json')) continue
    const name = basename(fn, '.json')
    const src = readFileSync(resolve(dir, fn), 'utf8')
    if (fn.startsWith('y_')) testSuccess(name, src)
    else testReject(name, src)
  }
})

describe('json-test-suite test_transform', () => {
  const dir = resolve(__dirname, 'json-test-suite', 'test_transform')
  for (const fn of readdirSync(dir)) {
    if (!fn.endsWith('.json')) continue
    const src = readFileSync(resolve(dir, fn), 'utf8')
    testSuccess(basename(fn, '.json'), src)
  }
})
