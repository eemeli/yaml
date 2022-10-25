import { parseDocument } from 'yaml'

describe('to-json', () => {
  test('empty-source-as-null', () => {
    const doc = parseDocument('foo: \nbar: 1234\nxxx: {}\nyyy: null')
    const copy = doc.clone()

    const json = copy.toJSON();

    expect(json).toMatchObject({
      foo: null,
      bar: 1234,
      xxx: {},
      yyy: null
    })
  })

  test('empty-source-as-non-null-object', () => {
    const doc = parseDocument('foo: \nbar: 1234\nxxx: {}\nyyy: null')
    const copy = doc.clone()

    const json = copy.toJS({ json: true, emptySourceAsObject: true });

    expect(json).toMatchObject({
      foo: {},
      bar: 1234,
      xxx: {},
      yyy: null
    })
  })
});