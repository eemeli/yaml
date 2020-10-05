import * as fc from 'fast-check'
import * as YAML from '../index.js'

describe('properties', () => {
  test('parse stringified object', () => {
    const key = fc.fullUnicodeString()
    const values = [
      key,
      fc.lorem(1000, false), // words
      fc.lorem(100, true), // sentences
      fc.boolean(),
      fc.integer(),
      fc.double(),
      fc.constantFrom(null, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)
    ]
    const yamlArbitrary = fc.anything({ key: key, values: values })
    const optionsArbitrary = fc.record(
      {
        keepCstNodes: fc.boolean(),
        keepNodeTypes: fc.boolean(),
        mapAsMap: fc.constant(false),
        merge: fc.boolean(),
        schema: fc.constantFrom('core', 'yaml-1.1') // ignore 'failsafe', 'json'
      },
      { withDeletedKeys: true }
    )

    fc.assert(
      fc.property(yamlArbitrary, optionsArbitrary, (obj, opts) => {
        expect(YAML.parse(YAML.stringify(obj, opts), opts)).toStrictEqual(obj)
      })
    )
  })
})
