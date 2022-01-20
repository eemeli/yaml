import { Document, parseDocument, merge } from 'yaml'

const getAsNode = (yamlStr: string) => {
  return parseDocument(yamlStr).contents
}

describe('Merge two Nodes', () => {

  test('maps', () => {
    const sourceNode = getAsNode('foo:\n  bar: baz\n')
    const targetDoc = parseDocument('foo:\n  abc: def\n')
    merge(targetDoc, sourceNode)
    const expected = parseDocument('foo:\n  abc: def\n  bar: baz\n')
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('seqs', () => {
    const sourceNode = getAsNode('foo:\n  - bar\n')
    const targetDoc = parseDocument('foo:\n  - abc\n')
    merge(targetDoc, sourceNode)
    const expected = parseDocument('foo:\n  - bar\n')
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('seqs with appendToSequences=true', () => {
    const sourceNode = getAsNode('foo:\n  - bar\n')
    const targetDoc = parseDocument('foo:\n  - abc\n')
    merge(targetDoc, sourceNode, { onSequence: 'append' })
    const expected = parseDocument('foo:\n  - abc\n  - bar\n')
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('existing paths are overridden', () => {
    const sourceNode = getAsNode('foo:\n  bar: baz\n')
    const targetDoc = parseDocument('foo:\n  bar: boo\n')
    merge(targetDoc, sourceNode)
    const expected = parseDocument('foo:\n  bar: baz\n')
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('deep maps', () => {
    const sourceNode = getAsNode('foo:\n  bar:\n    abc: def\n')
    const targetDoc = parseDocument('foo:\n  bar:\n    baz: boo\n  jkl:' +
      ' mno\n')
    merge(targetDoc, sourceNode)
    const expected = parseDocument('foo:\n  bar:\n    baz: boo\n    abc:' +
      ' def\n  jkl: mno\n')
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('maps inside seqs are appended', () => {
    const sourceNode = getAsNode('foo:\n  - abc: def\n')
    const targetDoc = parseDocument('foo:\n  - bar: baz\n')
    merge(targetDoc, sourceNode, { onSequence: 'append' })
    const expected = parseDocument('foo:\n  - bar: baz\n  - abc: def\n')
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('inexistent paths create new nodes', () => {
    const sourceNode = getAsNode('foo:\n  bar: baz\n')
    const targetDoc = parseDocument('abc: def\n')
    merge(targetDoc, sourceNode)
    const expected = parseDocument('abc: def\nfoo:\n  bar: baz\n')
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('merge accepts a document as an argument', () => {
    const sourceDoc = parseDocument('foo:\n  bar: baz\n')
    const targetDoc = parseDocument('foo:\n  abc: def\n')
    merge(targetDoc, sourceDoc)
    const expected = parseDocument('foo:\n  abc: def\n  bar: baz\n')
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('type conflict will throw an Error', () => {
    const sourceDoc = parseDocument('foo:\n  bar:\n    - baz\n')
    const targetDoc = parseDocument('foo:\n  bar: def\n')
    expect(() => merge(targetDoc, sourceDoc)).toThrow(
      'Conflict at "foo.bar": Destination node is of type Scalar, the node' +
      ' to be merged is of type YAMLSeq'
    )
  })

  test('comments on pairs', () => {
    const sourceDoc = parseDocument(`foo:
  # barbaz
    bar: baz

  # bazboo
    baz: boo
`)
    const targetDoc = parseDocument(`foo:
  # abcdef
  abc: def
  # boobaz
  boo: baz
`)
    merge(targetDoc, sourceDoc)
    const expected = parseDocument(`foo:
  # abcdef
  abc: def
  # boobaz
  boo: baz
  # barbaz
  bar: baz

  # bazboo
  baz: boo
`)
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('comments on seqs', () => {
    const sourceDoc = parseDocument(`foo:
  # barbaz
  - barbaz
  # bazboo
  - baz: boo
`)
    const targetDoc = parseDocument(`foo:
  # abcdef
  - abcdef

  # boobaz
  - boobaz
`)
    merge(targetDoc, sourceDoc, { onSequence: 'append' })
    const expected = parseDocument(`foo:
  # abcdef
  - abcdef

  # boobaz
  - boobaz
  # barbaz
  - barbaz
  # bazboo
  - baz: boo
`)
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('merging plain objects into doc', () => {
    const targetDoc = parseDocument('foo:\n  abc: def\n')
    merge(targetDoc,{ foo: { bar: 'baz' }  })
    const expected = parseDocument('foo:\n  abc: def\n  bar: baz\n')
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

  test('merging a collection into an empty doc', () => {
    const targetDoc = new Document()
    merge(targetDoc, { foo: { bar: 'baz' } })
    const expected = parseDocument('foo:\n  bar: baz\n')
    expect(targetDoc.toString()).toEqual(expected.toString())
  })

})