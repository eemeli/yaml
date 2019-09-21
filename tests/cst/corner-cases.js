import { source } from 'common-tags'
import parse from '../../src/cst/parse'

describe('folded block with chomp: keep', () => {
  test('nl + nl', () => {
    const src = `>+\nblock\n\n`
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('block\n\n')
  })

  test('nl + nl + sp + nl', () => {
    const src = '>+\nab\n\n \n'
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('ab\n\n \n')
  })
})

describe('folded block with indent indicator + leading empty lines + leading whitespace', () => {
  test('one blank line', () => {
    const src = '>1\n\n line\n'
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('\n line\n')
  })

  test('two blank lines', () => {
    const src = '>1\n\n\n line\n'
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('\n\n line\n')
  })
})

describe('multiple linebreaks in scalars', () => {
  test('plain', () => {
    const src = `trimmed\n\n\n\nlines\n`
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('trimmed\n\n\nlines')
  })

  test('single-quoted', () => {
    const src = `'trimmed\n\n\n\nlines'\n`
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('trimmed\n\n\nlines')
  })
})

test('no null document for document-end marker', () => {
  const src = '---\nx\n...\n'
  const docs = parse(src)
  expect(docs).toHaveLength(1)
})

test('explicit key after empty value', () => {
  const src = 'one:\n? two\n'
  const doc = parse(src)[0]
  const raw = doc.contents[0].items.map(it => it.rawValue)
  expect(raw).toMatchObject(['one', ':', '? two'])
})

test('seq with anchor as explicit key', () => {
  const src = '? &key\n- a\n'
  const doc = parse(src)[0]
  expect(doc.contents).toHaveLength(1)
  expect(doc.contents[0].items[0].node.rawValue).toBe('- a')
})

test('unindented single-quoted string', () => {
  const src = `key: 'two\nlines'\n`
  const doc = parse(src)[0]
  const { node } = doc.contents[0].items[1]
  expect(node.error).toBeNull()
  expect(node.strValue).toMatchObject({
    str: 'two lines',
    errors: [
      new SyntaxError(
        'Multi-line single-quoted string needs to be sufficiently indented'
      )
    ]
  })
})

describe('seq unindent to non-empty indent', () => {
  test('after map', () => {
    //  const src = `
    //  - a:|    - b|  - c|`
    const src = `
  - a:
    - b
  - c\n`
    const doc = parse(src)[0]
    expect(doc.contents).toHaveLength(2)
    expect(doc.contents[1].items).toHaveLength(2)
    expect(doc.contents[1].items[1].error).toBeNull()
  })

  test('after seq', () => {
    const src = `
  -
    - a
  - b\n`
    const doc = parse(src)[0]
    expect(doc.contents).toHaveLength(2)
    expect(doc.contents[1].items).toHaveLength(2)
    expect(doc.contents[1].items[1].error).toBeNull()
  })
})

test('eemeli/yaml#10', () => {
  const src = `
  a:
    - b
  c: d
`
  const doc = parse(src)[0]
  expect(doc.contents).toHaveLength(2)
  expect(doc.contents[1].items).toHaveLength(4)
  expect(doc.contents[1].items[1].error).toBeNull()
})

test('eemeli/yaml#19', () => {
  const src = 'a:\n  # 123'
  const doc = parse(src)[0]
  const { items } = doc.contents[0]
  expect(items).toHaveLength(2)
  expect(items[1].comment).toBe(' 123')
})

test('eemeli/yaml#20', () => {
  const src = 'a:\r\n  123\r\nb:\r\n  456\r\n'
  const docStream = parse(src)
  const a = docStream[0].contents[0].items[1].node
  expect(a.strValue).toBe('123')
  expect(docStream.setOrigRanges()).toBe(true)
  const { origStart: a0, origEnd: a1 } = a.valueRange
  expect(src.slice(a0, a1)).toBe('123')
  const b = docStream[0].contents[0].items[3].node
  expect(b.strValue).toBe('456')
  const { origStart: b0, origEnd: b1 } = b.valueRange
  expect(src.slice(b0, b1)).toBe('456')
})

test('eemeli/yaml#38', () => {
  const src = `
 -
 - - a
 -
`
  const doc = parse(src)[0]
  const { items } = doc.contents[1]
  expect(items).toHaveLength(3)
  items.forEach(item => {
    expect(item.error).toBe(null)
  })
})

test('eemeli/yaml#56', () => {
  const src = ':,\n'
  const doc = parse(src)[0]
  expect(doc.contents).toHaveLength(1)
  expect(doc.contents[0]).toMatchObject({
    error: null,
    strValue: ':,',
    type: 'PLAIN'
  })
})

describe('collection indicator as last char', () => {
  test('seq item', () => {
    const src = '-'
    const doc = parse(src)[0]
    expect(doc.contents[0]).toMatchObject({
      type: 'SEQ',
      items: [{ type: 'SEQ_ITEM', node: null }]
    })
  })

  test('explicit map key', () => {
    const src = '?'
    const doc = parse(src)[0]
    expect(doc.contents[0]).toMatchObject({
      type: 'MAP',
      items: [{ type: 'MAP_KEY', node: null }]
    })
  })

  test('empty map value', () => {
    const src = ':'
    const doc = parse(src)[0]
    expect(doc.contents[0]).toMatchObject({
      type: 'MAP',
      items: [{ type: 'MAP_VALUE', node: null }]
    })
  })

  test('indented seq-in-seq', () => {
    const src = ` -\n - - a\n -`
    const doc = parse(src)[0]
    expect(doc.contents[0]).toMatchObject({
      items: [
        { error: null },
        { node: { items: [{ node: { type: 'PLAIN', strValue: 'a' } }] } },
        { error: null }
      ]
    })
  })

  test('implicit map value separator', () => {
    const src = 'a:'
    const doc = parse(src)[0]
    expect(doc.contents[0]).toMatchObject({
      type: 'MAP',
      items: [
        { type: 'PLAIN', strValue: 'a' },
        { type: 'MAP_VALUE', node: null }
      ]
    })
  })
})

test('parse an empty string as an empty document', () => {
  const doc = parse('')[0]
  expect(doc).toMatchObject({
    error: null,
    contents: []
  })
})

test('re-stringify flow seq with comments', () => {
  const src = '[ #c\n1, #d\n2 ]\n'
  const doc = parse(src)
  expect(String(doc)).toBe(src)
})

test('blank line after less-indented comment (eemeli/yaml#91)', () => {
  const src = `
  foo1: bar
# comment

  foo2: baz`
  const doc = parse(src)
  expect(doc).toHaveLength(1)
  expect(doc[0].contents).toMatchObject([
    { type: 'BLANK_LINE' },
    { type: 'MAP' }
  ])
})

describe('flow collection as same-line mapping key value', () => {
  test('eemeli/yaml#113', () => {
    const src = source`
      ---
      foo:
        bar:
          enum: [
            "abc",
            "cde"
          ]
    `
    const doc = parse(src)
    const barValue = doc[0].contents[0].items[1].node.items[1].node
    expect(barValue.items[1].node).toMatchObject({
      error: null,
      items: [
        { char: '[' },
        { type: 'QUOTE_DOUBLE' },
        { char: ',' },
        { type: 'QUOTE_DOUBLE' },
        { char: ']' }
      ],
      type: 'FLOW_SEQ'
    })
  })

  test('eemeli/yaml#114', () => {
    const src = source`
      foo: {
        bar: boom
      }
    `
    const doc = parse(src)
    const flowCollection = doc[0].contents[0].items[1].node
    expect(flowCollection).toMatchObject({
      error: null,
      items: [
        { char: '{' },
        { type: 'PLAIN' },
        { char: ':' },
        { type: 'PLAIN' },
        { char: '}' }
      ],
      type: 'FLOW_MAP'
    })
  })

  test('Fails on insufficient indent', () => {
    const src = source`
      foo: {
        bar: boom
      }
    `
    const doc = parse(' ' + src)
    const flowCollection = doc[0].contents[0].items[1].node
    expect(flowCollection).toMatchObject({
      error: {
        message: 'Insufficient indentation in flow collection',
        name: 'YAMLSemanticError'
      },
      items: [
        { char: '{' },
        { type: 'PLAIN' },
        { char: ':' },
        { type: 'PLAIN' },
        { char: '}' }
      ],
      type: 'FLOW_MAP'
    })
  })
})
