import { parseDocument, stringify } from 'yaml'

test('tag test', () => {
  const broken = `- x: !!null

- y
`

  expect(stringify(parseDocument(broken))).toEqual(broken)
})
