import {
  Document,
  Pair,
  parseDocument,
  visit,
  visitAsync,
  YAMLMap,
  YAMLSeq,
  type Scalar
} from 'yaml'

const DOC = expect.any(Document)
const MAP = expect.any(YAMLMap)
const PAIR = expect.any(Pair)
const SEQ = expect.any(YAMLSeq)

for (const [visit_, title] of [
  [visit, 'visit()'],
  [visitAsync, 'visitAsync()']
] as const) {
  describe(title, () => {
    test('Map', async () => {
      const doc = parseDocument('{ one: 1, two }')
      const fn = vi.fn()
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, MAP, [DOC]],
        [0, { key: {}, value: {} }, [DOC, MAP]],
        ['key', { type: 'PLAIN', value: 'one' }, [DOC, MAP, PAIR]],
        ['value', { type: 'PLAIN', value: 1 }, [DOC, MAP, PAIR]],
        [1, { key: {}, value: {} }, [DOC, MAP]],
        ['key', { type: 'PLAIN', value: 'two' }, [DOC, MAP, PAIR]]
      ])
    })

    test('Seq', async () => {
      const doc = parseDocument('- 1\n- two\n')
      const fn = vi.fn()
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, SEQ, [DOC]],
        [0, { type: 'PLAIN', value: 1 }, [DOC, SEQ]],
        [1, { type: 'PLAIN', value: 'two' }, [DOC, SEQ]]
      ])
    })

    test('Alias', async () => {
      const doc = parseDocument('- &a 1\n- *a\n')
      const fn = vi.fn()
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, SEQ, [DOC]],
        [0, { type: 'PLAIN', value: 1, anchor: 'a' }, [DOC, SEQ]],
        [1, { source: 'a' }, [DOC, SEQ]]
      ])
    })

    test('Seq in Map', async () => {
      const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
      const fn = vi.fn()
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, MAP, [DOC]],
        [0, { key: {}, value: {} }, [DOC, MAP]],
        ['key', { type: 'PLAIN', value: 'foo' }, [DOC, MAP, PAIR]],
        ['value', SEQ, [DOC, MAP, PAIR]],
        [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [DOC, MAP, PAIR, SEQ]],
        [1, { type: 'QUOTE_SINGLE', value: 'two' }, [DOC, MAP, PAIR, SEQ]]
      ])
    })

    test('Visit called with non-Document root', async () => {
      const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
      const fn = vi.fn()
      await visit_(doc.get('foo') as Scalar, fn)
      expect(fn.mock.calls).toMatchObject([
        [null, SEQ, []],
        [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [SEQ]],
        [1, { type: 'QUOTE_SINGLE', value: 'two' }, [SEQ]]
      ])
    })

    test('Visiting a constructed document', async () => {
      const doc = new Document([1, 'two'])
      const fn = vi.fn()
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Alias: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, SEQ, [DOC]],
        [0, { value: 1 }, [DOC, SEQ]],
        [1, { value: 'two' }, [DOC, SEQ]]
      ])
      expect(String(doc)).toBe('- 1\n- two\n')
    })

    test('Only Scalar defined', async () => {
      const doc = parseDocument('foo:\n  - "one"\n  - \'two\'\n')
      const Scalar = vi.fn()
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        ['key', { type: 'PLAIN', value: 'foo' }, [DOC, MAP, PAIR]],
        [0, { type: 'QUOTE_DOUBLE', value: 'one' }, [DOC, MAP, PAIR, SEQ]],
        [1, { type: 'QUOTE_SINGLE', value: 'two' }, [DOC, MAP, PAIR, SEQ]]
      ])
    })

    test('Function as visitor', async () => {
      const doc = parseDocument('{ one: 1, two }')
      const fn = vi.fn()
      await visit_(doc, fn)
      expect(fn.mock.calls).toMatchObject([
        [null, MAP, [DOC]],
        [0, { key: {}, value: {} }, [DOC, MAP]],
        ['key', { type: 'PLAIN', value: 'one' }, [DOC, MAP, PAIR]],
        ['value', { type: 'PLAIN', value: 1 }, [DOC, MAP, PAIR]],
        [1, { key: {}, value: {} }, [DOC, MAP]],
        ['key', { type: 'PLAIN', value: 'two' }, [DOC, MAP, PAIR]],
        ['value', null, [DOC, MAP, PAIR]]
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
      const Scalar = vi.fn()
      await visit_(doc, {
        Seq(_, seq) {
          seq.push(doc.createNode('three'))
        },
        Scalar
      })
      expect(Scalar.mock.calls).toMatchObject([
        [0, { type: 'PLAIN', value: 'one' }, [DOC, SEQ]],
        [1, { type: 'PLAIN', value: 'two' }, [DOC, SEQ]],
        [2, { value: 'three' }, [DOC, SEQ]]
      ])
      expect(String(doc)).toBe('- one\n- two\n- three\n')
    })

    test('Do not visit block seq items', async () => {
      const doc = parseDocument('foo:\n  - one\n  - two\nbar:\n')
      const fn = vi.fn((_, node) =>
        node instanceof YAMLSeq ? visit_.SKIP : undefined
      )
      await visit_(doc, { Map: fn, Pair: fn, Seq: fn, Scalar: fn })
      expect(fn.mock.calls).toMatchObject([
        [null, MAP, [DOC]],
        [0, { key: {}, value: {} }, [DOC, MAP]],
        ['key', { type: 'PLAIN', value: 'foo' }, [DOC, MAP, PAIR]],
        ['value', SEQ, [DOC, MAP, PAIR]],
        [1, { key: {}, value: {} }, [DOC, MAP]],
        ['key', { type: 'PLAIN', value: 'bar' }, [DOC, MAP, PAIR]],
        ['value', { type: 'PLAIN', value: null }, [DOC, MAP, PAIR]]
      ])
    })

    test('Break visit on command', async () => {
      const doc = parseDocument('- one\n- two\n- three\n')
      const Scalar = vi.fn((_, node) =>
        node.value === 'two' ? visit_.BREAK : undefined
      )
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        [0, { type: 'PLAIN', value: 'one' }, [DOC, SEQ]],
        [1, { type: 'PLAIN', value: 'two' }, [DOC, SEQ]]
      ])
    })

    test('Modify seq item', async () => {
      const doc = parseDocument('- one\n- two\n- three\n')
      const Scalar = vi.fn((_, node) =>
        node.value === 'two' ? doc.createNode(42) : undefined
      )
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        [0, { type: 'PLAIN', value: 'one' }, [DOC, SEQ]],
        [1, { type: 'PLAIN', value: 'two' }, [DOC, SEQ]],
        [1, { value: 42 }, [DOC, SEQ]],
        [2, { type: 'PLAIN', value: 'three' }, [DOC, SEQ]]
      ])
      expect(String(doc)).toBe('- one\n- 42\n- three\n')
    })

    test('Skip seq item', async () => {
      const doc = parseDocument('- one\n- two\n- three\n')
      const Scalar = vi.fn(key => (key === 0 ? 2 : undefined))
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        [0, { type: 'PLAIN', value: 'one' }, [DOC, SEQ]],
        [2, { type: 'PLAIN', value: 'three' }, [DOC, SEQ]]
      ])
    })

    test('Remove seq item', async () => {
      const doc = parseDocument('- one\n- two\n- three\n')
      const Scalar = vi.fn((_, node) =>
        node.value === 'two' ? visit_.REMOVE : undefined
      )
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        [0, { type: 'PLAIN', value: 'one' }, [DOC, SEQ]],
        [1, { type: 'PLAIN', value: 'two' }, [DOC, SEQ]],
        [1, { type: 'PLAIN', value: 'three' }, [DOC, SEQ]]
      ])
      expect(String(doc)).toBe('- one\n- three\n')
    })

    test('Remove map value', async () => {
      const doc = parseDocument('one: 1\ntwo: 2\n')
      const Scalar = vi.fn((key, node) =>
        key === 'value' && node.value === 2 ? visit_.REMOVE : undefined
      )
      await visit_(doc, { Scalar })
      expect(Scalar.mock.calls).toMatchObject([
        ['key', { type: 'PLAIN', value: 'one' }, [DOC, MAP, PAIR]],
        ['value', { type: 'PLAIN', value: 1 }, [DOC, MAP, PAIR]],
        ['key', { type: 'PLAIN', value: 'two' }, [DOC, MAP, PAIR]],
        ['value', { type: 'PLAIN', value: 2 }, [DOC, MAP, PAIR]]
      ])
      expect(String(doc)).toBe('one: 1\ntwo: null\n')
    })

    test('Fail to replace root node', async () => {
      const doc = parseDocument('- one\n- two\n- three\n')
      const Seq = vi.fn(() => doc.createNode(42))
      if (visit_ === visit) {
        expect(() => visit_(doc.value, { Seq })).toThrow(
          'Cannot replace node with scalar parent'
        )
      } else {
        await expect(visit_(doc.value, { Seq })).rejects.toMatchObject({
          message: 'Cannot replace node with scalar parent'
        })
      }
    })
  })
}
