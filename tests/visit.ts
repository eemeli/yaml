import { Document, isSeq, parseDocument, Scalar, visit, visitAsync } from 'yaml'

const coll = { items: {} }

for (const [visit_, title] of [
  [visit, 'visit()'],
  [visitAsync, 'visitAsync()']
] as const) {
  describe(title, () => {
    test('Map', async () => {
      const doc = parseDocument('{ one: 1, two }')
      const fn = jest.fn()
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, coll, [{}]],
        [0, { key: {}, value: {} }, [{}, {}]],
        ['key', { type: 'PLAIN', value: 'one' }, [{}, {}, {}]],
        ['value', { type: 'PLAIN', value: 1 }, [{}, {}, {}]],
        [1, { key: {}, value: {} }, [{}, {}]],
        ['key', { type: 'PLAIN', value: 'two' }, [{}, {}, {}]]
      ])
    })

    test('Seq', async () => {
      const doc = parseDocument('- 1\n- two\n')
      const fn = jest.fn()
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, coll, [{ contents: {} }]],
        [0, { type: 'PLAIN', value: 1 }, [{ contents: {} }, coll]],
        [1, { type: 'PLAIN', value: 'two' }, [{ contents: {} }, coll]]
      ])
    })

    test('Alias', async () => {
      const doc = parseDocument('- &a 1\n- *a\n')
      const fn = jest.fn()
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, coll, [{}]],
        [0, { type: 'PLAIN', value: 1, anchor: 'a' }, [{}, {}]],
        [1, { source: 'a' }, [{}, {}]]
      ])
    })

    test('Seq in Map', async () => {
      const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
      const fn = jest.fn()
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, coll, [{}]],
        [0, { key: {}, value: {} }, [{}, {}]],
        ['key', { type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
        ['value', coll, [{}, {}, {}]],
        [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [{}, {}, {}, {}]],
        [1, { type: 'QUOTE_SINGLE', value: 'two' }, [{}, {}, {}, {}]]
      ])
    })

    test('Visit called with non-Document root', async () => {
      const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
      const fn = jest.fn()
      await visit_(doc.get('foo') as Scalar, fn)
      expect(fn.mock.calls).toMatchObject([
        [null, coll, []],
        [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [coll]],
        [1, { type: 'QUOTE_SINGLE', value: 'two' }, [coll]]
      ])
    })

    test('Visiting a constructed document', async () => {
      const doc = new Document([1, 'two'])
      const fn = jest.fn()
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, { items: [{}, {}] }, [{}]],
        [0, { value: 1 }, [{}, {}]],
        [1, { value: 'two' }, [{}, {}]]
      ])
      expect(String(doc)).toBe('- 1\n- two\n')
    })

    test('Only Scalar defined', async () => {
      const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
      const Scalar = jest.fn()
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        ['key', { type: 'PLAIN', value: 'foo' }, [{}, {}, {}]],
        [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [{}, {}, {}, {}]],
        [1, { type: 'QUOTE_SINGLE', value: 'two' }, [{}, {}, {}, {}]]
      ])
    })

    test('Function as visitor', async () => {
      const doc = parseDocument('{ one: 1, two }')
      const fn = jest.fn()
      await visit_(doc, fn)
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

    test('Change key value within Pair', async () => {
      const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
      await visit_(doc, {
        Pair(_, pair) {
          const sc = pair.key as Scalar
          if (sc.value === 'foo') sc.value = 'bar'
        }
      })
      expect(String(doc)).toBe('bar:\n  - "one"\n  - \'two\'\n')
    })

    test('Change key value within Scalar', async () => {
      const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
      await visit_(doc, {
        Scalar(key, node) {
          if (key === 'key' && node.value === 'foo') node.value = 'bar'
        }
      })
      expect(String(doc)).toBe('bar:\n  - "one"\n  - \'two\'\n')
    })

    test('Add item to Seq', async () => {
      const doc = parseDocument('- one\n- two\n')
      const Scalar = jest.fn()
      await visit_(doc, {
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

    test('Do not visit block seq items', async () => {
      const doc = parseDocument('foo:\n  - one\n  - two\nbar:\n')
      const fn = jest.fn((_, node) => (isSeq(node) ? visit_.SKIP : undefined))
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Scalar: fn })
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

    test('Break visit on command', async () => {
      const doc = parseDocument('- one\n- two\n- three\n')
      const Scalar = jest.fn((_, node) =>
        node.value === 'two' ? visit_.BREAK : undefined
      )
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        [0, { type: 'PLAIN', value: 'one' }, [{}, {}]],
        [1, { type: 'PLAIN', value: 'two' }, [{}, {}]]
      ])
    })

    test('Modify seq item', async () => {
      const doc = parseDocument('- one\n- two\n- three\n')
      const Scalar = jest.fn((_, node) =>
        node.value === 'two' ? doc.createNode(42) : undefined
      )
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        [0, { type: 'PLAIN', value: 'one' }, [{}, {}]],
        [1, { type: 'PLAIN', value: 'two' }, [{}, {}]],
        [1, { value: 42 }, [{}, {}]],
        [2, { type: 'PLAIN', value: 'three' }, [{}, {}]]
      ])
      expect(String(doc)).toBe('- one\n- 42\n- three\n')
    })

    test('Skip seq item', async () => {
      const doc = parseDocument('- one\n- two\n- three\n')
      const Scalar = jest.fn(key => (key === 0 ? 2 : undefined))
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        [0, { type: 'PLAIN', value: 'one' }, [{}, {}]],
        [2, { type: 'PLAIN', value: 'three' }, [{}, {}]]
      ])
    })

    test('Remove seq item', async () => {
      const doc = parseDocument('- one\n- two\n- three\n')
      const Scalar = jest.fn((_, node) =>
        node.value === 'two' ? visit_.REMOVE : undefined
      )
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        [0, { type: 'PLAIN', value: 'one' }, [{}, {}]],
        [1, { type: 'PLAIN', value: 'two' }, [{}, {}]],
        [1, { type: 'PLAIN', value: 'three' }, [{}, {}]]
      ])
      expect(String(doc)).toBe('- one\n- three\n')
    })

    test('Remove map value', async () => {
      const doc = parseDocument('one: 1\ntwo: 2\n')
      const Scalar = jest.fn((key, node) =>
        key === 'value' && node.value === 2 ? visit_.REMOVE : undefined
      )
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        ['key', { type: 'PLAIN', value: 'one' }, [{}, {}, {}]],
        ['value', { type: 'PLAIN', value: 1 }, [{}, {}, {}]],
        ['key', { type: 'PLAIN', value: 'two' }, [{}, {}, {}]],
        ['value', { type: 'PLAIN', value: 2 }, [{}, {}, {}]]
      ])
      expect(String(doc)).toBe('one: 1\ntwo: null\n')
    })

    test('Fail to replace root node', async () => {
      const doc = parseDocument('- one\n- two\n- three\n')
      const Seq = jest.fn(() => doc.createNode(42))
      if (visit_ === visit) {
        expect(() => visit_(doc.contents, { Seq })).toThrow(
          'Cannot replace node with scalar parent'
        )
      } else {
        await expect(visit_(doc.contents, { Seq })).rejects.toMatchObject({
          message: 'Cannot replace node with scalar parent'
        })
      }
    })
  })
}
