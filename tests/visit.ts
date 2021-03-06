import { Document, isSeq, parseDocument, Scalar, visit } from 'yaml'

const coll = { items: {} }

test('Map', () => {
  const doc = parseDocument('{ one: 1, two }')
  const fn = jest.fn()
  visit(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
  expect(fn.mock.calls).toMatchObject([
    [null, coll, [{}]],
    [0, { key: {}, value: {} }, [{}, {}]],
    ['key', { type: 'PLAIN', value: 'one' }, [{}, {}, {}]],
    ['value', { type: 'PLAIN', value: 1 }, [{}, {}, {}]],
    [1, { key: {}, value: {} }, [{}, {}]],
    ['key', { type: 'PLAIN', value: 'two' }, [{}, {}, {}]]
  ])
})

test('Seq', () => {
  const doc = parseDocument('- 1\n- two\n')
  const fn = jest.fn()
  visit(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
  expect(fn.mock.calls).toMatchObject([
    [null, coll, [{ contents: {} }]],
    [0, { type: 'PLAIN', value: 1 }, [{ contents: {} }, coll]],
    [1, { type: 'PLAIN', value: 'two' }, [{ contents: {} }, coll]]
  ])
})

test('Alias', () => {
  const doc = parseDocument('- &a 1\n- *a\n')
  const fn = jest.fn()
  visit(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
  expect(fn.mock.calls).toMatchObject([
    [null, coll, [{}]],
    [0, { type: 'PLAIN', value: 1, anchor: 'a' }, [{}, {}]],
    [1, { source: 'a' }, [{}, {}]]
  ])
})

test('Seq in Map', () => {
  const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
  const fn = jest.fn()
  visit(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
  expect(fn.mock.calls).toMatchObject([
    [null, coll, [{}]],
    [0, { key: {}, value: {} }, [{}, {}]],
    ['key', { type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
    ['value', coll, [{}, {}, {}]],
    [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [{}, {}, {}, {}]],
    [1, { type: 'QUOTE_SINGLE', value: 'two' }, [{}, {}, {}, {}]]
  ])
})

test('Visit called with non-Document root', () => {
  const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
  const fn = jest.fn()
  visit(doc.get('foo') as Scalar, fn)
  expect(fn.mock.calls).toMatchObject([
    [null, coll, []],
    [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [coll]],
    [1, { type: 'QUOTE_SINGLE', value: 'two' }, [coll]]
  ])
})

test('Visiting a constructed document', () => {
  const doc = new Document([1, 'two'])
  const fn = jest.fn()
  visit(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
  expect(fn.mock.calls).toMatchObject([
    [null, { items: [{}, {}] }, [{}]],
    [0, { value: 1 }, [{}, {}]],
    [1, { value: 'two' }, [{}, {}]]
  ])
  expect(String(doc)).toBe('- 1\n- two\n')
})

test('Only Scalar defined', () => {
  const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
  const Scalar = jest.fn()
  visit(doc, { Scalar })
  expect(Scalar.mock.calls).toMatchObject([
    ['key', { type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
    [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [{}, {}, {}, {}]],
    [1, { type: 'QUOTE_SINGLE', value: 'two' }, [{}, {}, {}, {}]]
  ])
})

test('Function as visitor', () => {
  const doc = parseDocument('{ one: 1, two }')
  const fn = jest.fn()
  visit(doc, fn)
  expect(fn.mock.calls).toMatchObject([
    [null, coll, [{}]],
    [0, { key: {}, value: {} }, [{}, {}]],
    ['key', { type: 'PLAIN', value: 'one' }, [{}, {}, {}]],
    ['value', { type: 'PLAIN', value: 1 }, [{}, {}, {}]],
    [1, { key: {}, value: {} }, [{}, {}]],
    ['key', { type: 'PLAIN', value: 'two' }, [{}, {}, {}]],
    ['value', null, [{}, {}, {}]]
  ])
})

test('Change key value within Pair', () => {
  const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
  visit(doc, {
    Pair(_, pair) {
      const sc = pair.key as Scalar
      if (sc.value === 'foo') sc.value = 'bar'
    }
  })
  expect(String(doc)).toBe('bar:\n  - "one"\n  - \'two\'\n')
})

test('Change key value within Scalar', () => {
  const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
  visit(doc, {
    Scalar(key, node) {
      if (key === 'key' && node.value === 'foo') node.value = 'bar'
    }
  })
  expect(String(doc)).toBe('bar:\n  - "one"\n  - \'two\'\n')
})

test('Add item to Seq', () => {
  const doc = parseDocument('- one\n- two\n')
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
  const doc = parseDocument('foo:\n  - one\n  - two\nbar:\n')
  const fn = jest.fn((_, node) => (isSeq(node) ? visit.SKIP : undefined))
  visit(doc, { Map: fn, Pair: fn, Seq: fn, Scalar: fn })
  expect(fn.mock.calls).toMatchObject([
    [null, coll, [{}]],
    [0, { key: {}, value: {} }, [{}, {}]],
    ['key', { type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
    ['value', coll, [{}, {}, {}]],
    [1, { key: {}, value: {} }, [{}, {}]],
    ['key', { type: 'PLAIN', value: 'bar' }, [{}, {}, {}]],
    ['value', { type: 'PLAIN', value: null }, [{}, {}, {}]]
  ])
})

test('Break visit on command', () => {
  const doc = parseDocument('- one\n- two\n- three\n')
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
  const doc = parseDocument('- one\n- two\n- three\n')
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
  const doc = parseDocument('- one\n- two\n- three\n')
  const Scalar = jest.fn(key => (key === 0 ? 2 : undefined))
  visit(doc, { Scalar })
  expect(Scalar.mock.calls).toMatchObject([
    [0, { type: 'PLAIN', value: 'one' }, [{}, {}]],
    [2, { type: 'PLAIN', value: 'three' }, [{}, {}]]
  ])
})

test('Remove seq item', () => {
  const doc = parseDocument('- one\n- two\n- three\n')
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
  const doc = parseDocument('one: 1\ntwo: 2\n')
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
  const doc = parseDocument('- one\n- two\n- three\n')
  const Seq = jest.fn(() => doc.createNode(42))
  expect(() => visit(doc.contents, { Seq })).toThrow(
    'Cannot replace node with scalar parent'
  )
})
