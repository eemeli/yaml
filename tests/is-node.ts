import {
  Alias,
  Document,
  isAlias,
  isCollection,
  isDocument,
  isMap,
  isNode,
  isPair,
  isScalar,
  isSeq,
  Pair,
  parseDocument,
  Scalar,
  YAMLMap,
  YAMLSeq
} from 'yaml'

for (const { fn, exp } of [
  {
    fn: isAlias,
    exp: {
      doc: false,
      scalar: false,
      map: false,
      seq: false,
      alias: true,
      pair: false
    }
  },
  {
    fn: isCollection,
    exp: {
      doc: false,
      scalar: false,
      map: true,
      seq: true,
      alias: false,
      pair: false
    }
  },
  {
    fn: isDocument,
    exp: {
      doc: true,
      scalar: false,
      map: false,
      seq: false,
      alias: false,
      pair: false
    }
  },
  {
    fn: isMap,
    exp: {
      doc: false,
      scalar: false,
      map: true,
      seq: false,
      alias: false,
      pair: false
    }
  },
  {
    fn: isNode,
    exp: {
      doc: false,
      scalar: true,
      map: true,
      seq: true,
      alias: true,
      pair: false
    }
  },
  {
    fn: isPair,
    exp: {
      doc: false,
      scalar: false,
      map: false,
      seq: false,
      alias: false,
      pair: true
    }
  },
  {
    fn: isScalar,
    exp: {
      doc: false,
      scalar: true,
      map: false,
      seq: false,
      alias: false,
      pair: false
    }
  },
  {
    fn: isSeq,
    exp: {
      doc: false,
      scalar: false,
      map: false,
      seq: true,
      alias: false,
      pair: false
    }
  }
] as { fn: (x: unknown) => boolean; exp: Record<string, boolean> }[]) {
  describe(fn.name, () => {
    test('parsed doc', () => {
      const doc = parseDocument('foo')
      expect(fn(doc)).toBe(exp.doc)
    })

    test('parsed scalar', () => {
      const doc = parseDocument('foo')
      expect(fn(doc.contents)).toBe(exp.scalar)
    })

    test('parsed map', () => {
      const doc = parseDocument('foo: bar')
      expect(fn(doc.contents)).toBe(exp.map)
    })

    test('parsed seq', () => {
      const doc = parseDocument('[foo, bar]')
      expect(fn(doc.contents)).toBe(exp.seq)
    })

    test('parsed alias', () => {
      const doc = parseDocument<YAMLSeq.Parsed>('[ &a foo, *a ]')
      expect(fn(doc.contents?.items[1])).toBe(exp.alias)
    })

    test('parsed pair', () => {
      const doc = parseDocument<YAMLMap.Parsed>('foo: bar')
      expect(fn(doc.contents?.items[0])).toBe(exp.pair)
    })

    test('created doc', () => {
      expect(fn(new Document())).toBe(exp.doc)
    })

    test('created scalar', () => {
      expect(fn(new Scalar(42))).toBe(exp.scalar)
    })

    test('created map', () => {
      expect(fn(new YAMLMap())).toBe(exp.map)
    })

    test('created seq', () => {
      expect(fn(new YAMLSeq())).toBe(exp.seq)
    })

    test('created alias', () => {
      expect(fn(new Alias('42'))).toBe(exp.alias)
    })

    test('created pair', () => {
      expect(fn(new Pair(null))).toBe(exp.pair)
    })

    test('null', () => {
      expect(fn(null)).toBe(false)
    })

    test('string', () => {
      expect(fn('foo')).toBe(false)
    })

    test('object', () => {
      expect(fn({ type: 'SCALAR', value: 42 })).toBe(false)
    })
  })
}
