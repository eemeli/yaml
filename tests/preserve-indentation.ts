import { parseDocument } from 'yaml'

describe('preserveCollectionIndentation', () => {
  // This sample document has very unusual indentation, which helps
  // to ensure that it really does end up being preserved exactly.
  const sample = `
a:
      b:
       c: d
       more: e

big_indent:
         - a
         - b
         - c
more:
   # A comment goes here,
   # which spans multiple lines.

   # Ideally, a blank line is still preserved as well,
   # so that large comment blocks can be separated.
   a:
    - x # after the item
    # between items
    - y:
       further:
        indentation:
        - is
        - possible
        - even:
           tho:
                  it:
                         changes: a lot
    - z
    # after last
`

  test('preserveCollectionIndentation: toString() preserve document indentation', () => {
    const document = parseDocument(sample, {
      preserveCollectionIndentation: true
    })
    const roundtrippedSource = document.toString()

    expect(roundtrippedSource.trim()).toEqual(sample.trim())
  })

  // sample2 corresponds to the JSON `{"foo": ["a", "b", "c"]}`
  // The Seq is not indented at all, and we can preserve that when
  // parsing.
  const sample2 = `
foo:
- a
- b
- c
`
  // However, when we edit the field to replace the list with an object,
  // some indentation is now required. In this case, we default to the
  // original 'indentStep' value (e.g. 2 in this case) because some
  // level of indentation is required.
  const sample3 = `
foo:
  a: 1
  b: 2
  c: 3
`

  test('preserveCollectionIndentation: produces correct yaml when preserving indentation with edits', () => {
    const document = parseDocument(sample2, {
      preserveCollectionIndentation: true
    })
    expect(document.toString().trim()).toEqual(sample2.trim())

    // When replacing the item, we now need indentation, since otherwise
    // the document has a different structure than it initially did.
    document.set('foo', { a: 1, b: 2, c: 3 })
    expect(document.toString().trim()).toEqual(sample3.trim())
  })

  const combined = `
a:
  b:
    c: d
    more: e

big_indent:
  - a
  - b
  - c
more:
  # A comment goes here,
  # which spans multiple lines.

  # Ideally, a blank line is still preserved as well,
  # so that large comment blocks can be separated.
  a:
    - x # after the item
    # between items
    - y:
        further:
          indentation:
            - is
            - possible
            - even:
                tho:
                  it:
                    changes: a lot
    - z
    # after last
preservedDocument:
  a:
        b:
         c: d
         more: e

  big_indent:
           - a
           - b
           - c
  more:
     # A comment goes here,
     # which spans multiple lines.

     # Ideally, a blank line is still preserved as well,
     # so that large comment blocks can be separated.
     a:
      - x # after the item
      # between items
      - y:
         further:
          indentation:
          - is
          - possible
          - even:
             tho:
                    it:
                           changes: a lot
      - z
      # after last
`

  test('preserveCollectionIndentation: documents with preserved indentation can be inserted into other documents', () => {
    const document = parseDocument(sample, {
      preserveCollectionIndentation: true
    })

    // In this new document, we purposefully skip preserving indentation:
    const newDocument = parseDocument(sample, {
      preserveCollectionIndentation: false
    })

    // The indentation-preserved document is inserted into the "main" document,
    // and maintains its original indentation level.
    newDocument.set('preservedDocument', document)

    expect(newDocument.toString().trim()).toEqual(combined.trim())
  })
})
