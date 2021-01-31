import * as YAML from '../index.js'
import { visit } from '../util.js'

describe('visitor', () => {
  test('Map', () => {
    const doc = YAML.parseDocument('{ one: 1, two }')
    const fn = jest.fn()
    visit(doc, { Document: fn, Map: fn, Pair: fn, Seq: fn, Scalar: fn })
    expect(fn.mock.calls).toMatchObject([
      [{ type: 'DOCUMENT' }, []],
      [{ type: 'FLOW_MAP' }, [{}]],
      [{ type: 'PAIR' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'one' }, [{}, {}, {}]],
      [{ type: 'PLAIN', value: 1 }, [{}, {}, {}]],
      [{ type: 'PAIR' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'two' }, [{}, {}, {}]]
    ])
  })

  test('Seq', () => {
    const doc = YAML.parseDocument('- 1\n- two\n')
    const fn = jest.fn()
    visit(doc, { Document: fn, Map: fn, Pair: fn, Seq: fn, Scalar: fn })
    expect(fn.mock.calls).toMatchObject([
      [{ type: 'DOCUMENT' }, []],
      [{ type: 'SEQ' }, [{ type: 'DOCUMENT' }]],
      [{ type: 'PLAIN', value: 1 }, [{ type: 'DOCUMENT' }, { type: 'SEQ' }]],
      [{ type: 'PLAIN', value: 'two' }, [{ type: 'DOCUMENT' }, { type: 'SEQ' }]]
    ])
  })

  test('Seq in Map', () => {
    const doc = YAML.parseDocument('foo:\n  - "one"\n  - \'two\'\n')
    const fn = jest.fn()
    visit(doc, { Document: fn, Map: fn, Pair: fn, Seq: fn, Scalar: fn })
    expect(fn.mock.calls).toMatchObject([
      [{ type: 'DOCUMENT' }, []],
      [{ type: 'MAP' }, [{}]],
      [{ type: 'PAIR' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
      [{ type: 'SEQ' }, [{}, {}, {}]],
      [{ type: 'QUOTE_DOUBLE', value: 'one' }, [{}, {}, {}, {}]],
      [{ type: 'QUOTE_SINGLE', value: 'two' }, [{}, {}, {}, {}]]
    ])
  })

  test('Visit called with non-Document root', () => {
    const doc = YAML.parseDocument('foo:\n  - "one"\n  - \'two\'\n')
    const fn = jest.fn()
    visit(doc.get('foo'), fn)
    expect(fn.mock.calls).toMatchObject([
      [{ type: 'SEQ' }, []],
      [{ type: 'QUOTE_DOUBLE', value: 'one' }, [{ type: 'SEQ' }]],
      [{ type: 'QUOTE_SINGLE', value: 'two' }, [{ type: 'SEQ' }]]
    ])
  })

  test('Only Scalar defined', () => {
    const doc = YAML.parseDocument('foo:\n  - "one"\n  - \'two\'\n')
    const Scalar = jest.fn()
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      [{ type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
      [{ type: 'QUOTE_DOUBLE', value: 'one' }, [{}, {}, {}, {}]],
      [{ type: 'QUOTE_SINGLE', value: 'two' }, [{}, {}, {}, {}]]
    ])
  })

  test('Function as visitor', () => {
    const doc = YAML.parseDocument('{ one: 1, two }')
    const fn = jest.fn()
    visit(doc, fn)
    expect(fn.mock.calls).toMatchObject([
      [{ type: 'DOCUMENT' }, []],
      [{ type: 'FLOW_MAP' }, [{}]],
      [{ type: 'PAIR' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'one' }, [{}, {}, {}]],
      [{ type: 'PLAIN', value: 1 }, [{}, {}, {}]],
      [{ type: 'PAIR' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'two' }, [{}, {}, {}]],
      [null, [{}, {}, {}]]
    ])
  })

  test('Change key value', () => {
    const doc = YAML.parseDocument('foo:\n  - "one"\n  - \'two\'\n')
    visit(doc, {
      Pair(pair) {
        if (pair.key.value === 'foo') pair.key.value = 'bar'
      }
    })
    expect(String(doc)).toBe('bar:\n  - "one"\n  - \'two\'\n')
  })

  test('Add item to Seq', () => {
    const doc = YAML.parseDocument('- one\n- two\n')
    const Scalar = jest.fn()
    visit(doc, {
      Seq(seq) {
        seq.items.push(doc.createNode('three'))
      },
      Scalar
    })
    expect(Scalar.mock.calls).toMatchObject([
      [{ type: 'PLAIN', value: 'one' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'two' }, [{}, {}]],
      [{ value: 'three' }, [{}, {}]]
    ])
    expect(String(doc)).toBe('- one\n- two\n- three\n')
  })

  test('Do not visit seq items', () => {
    const doc = YAML.parseDocument('foo:\n  - one\n  - two\nbar:\n')
    const fn = jest.fn(node => (node.type === 'SEQ' ? visit.SKIP : undefined))
    visit(doc, { Document: fn, Map: fn, Pair: fn, Seq: fn, Scalar: fn })
    expect(fn.mock.calls).toMatchObject([
      [{ type: 'DOCUMENT' }, []],
      [{ type: 'MAP' }, [{}]],
      [{ type: 'PAIR' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
      [{ type: 'SEQ' }, [{}, {}, {}]],
      [{ type: 'PAIR' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'bar' }, [{}, {}, {}]]
    ])
  })

  test('Break visit on command', () => {
    const doc = YAML.parseDocument('- one\n- two\n- three\n')
    const Scalar = jest.fn(node =>
      node.value === 'two' ? visit.BREAK : undefined
    )
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      [{ type: 'PLAIN', value: 'one' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'two' }, [{}, {}]]
    ])
  })

  test('Modify seq item', () => {
    const doc = YAML.parseDocument('- one\n- two\n- three\n')
    const Scalar = jest.fn(node =>
      node.value === 'two' ? doc.createNode(42) : undefined
    )
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      [{ type: 'PLAIN', value: 'one' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'two' }, [{}, {}]],
      [{ value: 42 }, [{}, {}]],
      [{ type: 'PLAIN', value: 'three' }, [{}, {}]]
    ])
    expect(String(doc)).toBe('- one\n- 42\n- three\n')
  })

  test('Remove seq item', () => {
    const doc = YAML.parseDocument('- one\n- two\n- three\n')
    const Scalar = jest.fn(node =>
      node.value === 'two' ? visit.REMOVE : undefined
    )
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      [{ type: 'PLAIN', value: 'one' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'two' }, [{}, {}]],
      [{ type: 'PLAIN', value: 'three' }, [{}, {}]]
    ])
    expect(String(doc)).toBe('- one\n- three\n')
  })

  test('Remove map value', () => {
    const doc = YAML.parseDocument('one: 1\ntwo: 2\n')
    const Scalar = jest.fn(node =>
      node.value === 2 ? visit.REMOVE : undefined
    )
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      [{ type: 'PLAIN', value: 'one' }, [{}, {}, {}]],
      [{ type: 'PLAIN', value: 1 }, [{}, {}, {}]],
      [{ type: 'PLAIN', value: 'two' }, [{}, {}, {}]],
      [{ type: 'PLAIN', value: 2 }, [{}, {}, {}]]
    ])
    expect(String(doc)).toBe('one: 1\ntwo: null\n')
  })
})
