import * as YAML from '../index.js'
import { visit } from '../util.js'

describe('visitor', () => {
  test('Map', () => {
    const doc = YAML.parseDocument('{ one: 1, two }')
    const fn = jest.fn()
    visit(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
    expect(fn.mock.calls).toMatchObject([
      [null, { type: 'FLOW_MAP' }, [{}]],
      [0, { type: 'PAIR' }, [{}, {}]],
      ['key', { type: 'PLAIN', value: 'one' }, [{}, {}, {}]],
      ['value', { type: 'PLAIN', value: 1 }, [{}, {}, {}]],
      [1, { type: 'PAIR' }, [{}, {}]],
      ['key', { type: 'PLAIN', value: 'two' }, [{}, {}, {}]]
    ])
  })

  test('Seq', () => {
    const doc = YAML.parseDocument('- 1\n- two\n')
    const fn = jest.fn()
    visit(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
    expect(fn.mock.calls).toMatchObject([
      [null, { type: 'SEQ' }, [{ type: 'DOCUMENT' }]],
      [0, { type: 'PLAIN', value: 1 }, [{ type: 'DOCUMENT' }, { type: 'SEQ' }]],
      [
        1,
        { type: 'PLAIN', value: 'two' },
        [{ type: 'DOCUMENT' }, { type: 'SEQ' }]
      ]
    ])
  })

  test('Alias', () => {
    const doc = YAML.parseDocument('- &a 1\n- *a\n')
    const fn = jest.fn()
    visit(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
    expect(fn.mock.calls).toMatchObject([
      [null, { type: 'SEQ' }, [{}]],
      [0, { type: 'PLAIN', value: 1 }, [{}, {}]],
      [1, { type: 'ALIAS', source: { value: 1 } }, [{}, {}]]
    ])
  })

  test('Seq in Map', () => {
    const doc = YAML.parseDocument('foo:\n  - "one"\n  - \'two\'\n')
    const fn = jest.fn()
    visit(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
    expect(fn.mock.calls).toMatchObject([
      [null, { type: 'MAP' }, [{}]],
      [0, { type: 'PAIR' }, [{}, {}]],
      ['key', { type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
      ['value', { type: 'SEQ' }, [{}, {}, {}]],
      [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [{}, {}, {}, {}]],
      [1, { type: 'QUOTE_SINGLE', value: 'two' }, [{}, {}, {}, {}]]
    ])
  })

  test('Visit called with non-Document root', () => {
    const doc = YAML.parseDocument('foo:\n  - "one"\n  - \'two\'\n')
    const fn = jest.fn()
    visit(doc.get('foo'), fn)
    expect(fn.mock.calls).toMatchObject([
      [null, { type: 'SEQ' }, []],
      [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [{ type: 'SEQ' }]],
      [1, { type: 'QUOTE_SINGLE', value: 'two' }, [{ type: 'SEQ' }]]
    ])
  })

  test('Only Scalar defined', () => {
    const doc = YAML.parseDocument('foo:\n  - "one"\n  - \'two\'\n')
    const Scalar = jest.fn()
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      ['key', { type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
      [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [{}, {}, {}, {}]],
      [1, { type: 'QUOTE_SINGLE', value: 'two' }, [{}, {}, {}, {}]]
    ])
  })

  test('Function as visitor', () => {
    const doc = YAML.parseDocument('{ one: 1, two }')
    const fn = jest.fn()
    visit(doc, fn)
    expect(fn.mock.calls).toMatchObject([
      [null, { type: 'FLOW_MAP' }, [{}]],
      [0, { type: 'PAIR' }, [{}, {}]],
      ['key', { type: 'PLAIN', value: 'one' }, [{}, {}, {}]],
      ['value', { type: 'PLAIN', value: 1 }, [{}, {}, {}]],
      [1, { type: 'PAIR' }, [{}, {}]],
      ['key', { type: 'PLAIN', value: 'two' }, [{}, {}, {}]],
      ['value', null, [{}, {}, {}]]
    ])
  })

  test('Change key value within Pair', () => {
    const doc = YAML.parseDocument('foo:\n  - "one"\n  - \'two\'\n')
    visit(doc, {
      Pair(_, pair) {
        if (pair.key.value === 'foo') pair.key.value = 'bar'
      }
    })
    expect(String(doc)).toBe('bar:\n  - "one"\n  - \'two\'\n')
  })

  test('Change key value within Scalar', () => {
    const doc = YAML.parseDocument('foo:\n  - "one"\n  - \'two\'\n')
    visit(doc, {
      Scalar(key, node) {
        if (key === 'key' && node.value === 'foo') node.value = 'bar'
      }
    })
    expect(String(doc)).toBe('bar:\n  - "one"\n  - \'two\'\n')
  })

  test('Add item to Seq', () => {
    const doc = YAML.parseDocument('- one\n- two\n')
    const Scalar = jest.fn()
    visit(doc, {
      Seq(_, seq) {
        seq.items.push(doc.createNode('three'))
      },
      Scalar
    })
    expect(Scalar.mock.calls).toMatchObject([
      [0, { type: 'PLAIN', value: 'one' }, [{}, {}]],
      [1, { type: 'PLAIN', value: 'two' }, [{}, {}]],
      [2, { value: 'three' }, [{}, {}]]
    ])
    expect(String(doc)).toBe('- one\n- two\n- three\n')
  })

  test('Do not visit block seq items', () => {
    const doc = YAML.parseDocument('foo:\n  - one\n  - two\nbar:\n')
    const fn = jest.fn((_, node) =>
      node.type === 'SEQ' ? visit.SKIP : undefined
    )
    visit(doc, { Map: fn, Pair: fn, Seq: fn, Scalar: fn })
    expect(fn.mock.calls).toMatchObject([
      [null, { type: 'MAP' }, [{}]],
      [0, { type: 'PAIR' }, [{}, {}]],
      ['key', { type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
      ['value', { type: 'SEQ' }, [{}, {}, {}]],
      [1, { type: 'PAIR' }, [{}, {}]],
      ['key', { type: 'PLAIN', value: 'bar' }, [{}, {}, {}]]
    ])
  })

  test('Break visit on command', () => {
    const doc = YAML.parseDocument('- one\n- two\n- three\n')
    const Scalar = jest.fn((_, node) =>
      node.value === 'two' ? visit.BREAK : undefined
    )
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      [0, { type: 'PLAIN', value: 'one' }, [{}, {}]],
      [1, { type: 'PLAIN', value: 'two' }, [{}, {}]]
    ])
  })

  test('Modify seq item', () => {
    const doc = YAML.parseDocument('- one\n- two\n- three\n')
    const Scalar = jest.fn((_, node) =>
      node.value === 'two' ? doc.createNode(42) : undefined
    )
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      [0, { type: 'PLAIN', value: 'one' }, [{}, {}]],
      [1, { type: 'PLAIN', value: 'two' }, [{}, {}]],
      [1, { value: 42 }, [{}, {}]],
      [2, { type: 'PLAIN', value: 'three' }, [{}, {}]]
    ])
    expect(String(doc)).toBe('- one\n- 42\n- three\n')
  })

  test('Skip seq item', () => {
    const doc = YAML.parseDocument('- one\n- two\n- three\n')
    const Scalar = jest.fn(key => (key === 0 ? 2 : undefined))
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      [0, { type: 'PLAIN', value: 'one' }, [{}, {}]],
      [2, { type: 'PLAIN', value: 'three' }, [{}, {}]]
    ])
  })

  test('Remove seq item', () => {
    const doc = YAML.parseDocument('- one\n- two\n- three\n')
    const Scalar = jest.fn((_, node) =>
      node.value === 'two' ? visit.REMOVE : undefined
    )
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      [0, { type: 'PLAIN', value: 'one' }, [{}, {}]],
      [1, { type: 'PLAIN', value: 'two' }, [{}, {}]],
      [1, { type: 'PLAIN', value: 'three' }, [{}, {}]]
    ])
    expect(String(doc)).toBe('- one\n- three\n')
  })

  test('Remove map value', () => {
    const doc = YAML.parseDocument('one: 1\ntwo: 2\n')
    const Scalar = jest.fn((key, node) =>
      key === 'value' && node.value === 2 ? visit.REMOVE : undefined
    )
    visit(doc, { Scalar })
    expect(Scalar.mock.calls).toMatchObject([
      ['key', { type: 'PLAIN', value: 'one' }, [{}, {}, {}]],
      ['value', { type: 'PLAIN', value: 1 }, [{}, {}, {}]],
      ['key', { type: 'PLAIN', value: 'two' }, [{}, {}, {}]],
      ['value', { type: 'PLAIN', value: 2 }, [{}, {}, {}]]
    ])
    expect(String(doc)).toBe('one: 1\ntwo: null\n')
  })

  test('Fail to replace root node', () => {
    const doc = YAML.parseDocument('- one\n- two\n- three\n')
    const Seq = jest.fn(() => doc.createNode(42))
    expect(() => visit(doc.contents, { Seq })).toThrow(
      'Cannot replace node with undefined parent'
    )
  })
})
