import * as fc from 'fast-check'
import { parse, stringify } from 'yaml'

describe('properties', () => {
  test('parse stringified object', () => {
    const key = fc.fullUnicodeString()
    const values = [
      key,
      fc.lorem({ maxCount: 1000, mode: 'words' }),
      fc.lorem({ maxCount: 100, mode: 'sentences' }),
      fc.boolean(),
      fc.integer(),
      fc.double(),
      fc.constantFrom(null, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)
    ]
    const yamlArbitrary = fc.anything({ key: key, values: values })
    const optionsArbitrary = fc.record(
      {
        mapAsMap: fc.constant(false),
        merge: fc.boolean(),
        schema: fc.constantFrom<('core' | 'yaml-1.1')[]>('core', 'yaml-1.1') // ignore 'failsafe', 'json'
      },
      { withDeletedKeys: true }
    )

    fc.assert(
      fc.property(yamlArbitrary, optionsArbitrary, (obj, opts) => {
        expect(parse(stringify(obj, opts), opts)).toStrictEqual(obj)
      })
    )
  })
})
