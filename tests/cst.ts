import { CST, Parser } from 'yaml'
import { source } from './_utils'

function cstDoc(src: string) {
  const tokens = Array.from(new Parser().parse(src))
  expect(tokens).toHaveLength(1)
  expect(tokens[0].type).toBe('document')
  return tokens[0] as CST.Document
}

describe('CST.visit', () => {
  test('Visit paths in order', () => {
    const doc = cstDoc(source`
      foo:
        - baz
        - [ bar: 42 ]
      ? { fuzz, ball }
      : fii
    `)
    const paths: CST.VisitPath[] = []
    CST.visit(doc, (_item, path) => {
      paths.push(path)
    })
    expect(paths).toMatchObject([
      [],
      [['value', 0]],
      [
        ['value', 0],
        ['value', 0]
      ],
      [
        ['value', 0],
        ['value', 1]
      ],
      [
        ['value', 0],
        ['value', 1],
        ['value', 0]
      ],
      [['value', 1]],
      [
        ['value', 1],
        ['key', 0]
      ],
      [
        ['value', 1],
        ['key', 1]
      ]
    ])
  })

  test('break visit', () => {
    const doc = cstDoc(source`
      - " foo"
      - "foo"
      - "bar"
    `)
    let visits = 0
    CST.visit(doc, item => {
      visits += 1
      const scalar = CST.resolveAsScalar(item.value)
      if (scalar?.value === 'foo') return CST.visit.BREAK
    })
    expect(visits).toBe(3)
  })

  test('remove item', () => {
    const doc = cstDoc(source`
      -  " foo"
      - "foo"
      - "bar"
    `)
    let visits = 0
    CST.visit(doc, item => {
      visits += 1
      const scalar = CST.resolveAsScalar(item.value)
      if (scalar?.value === 'foo') return CST.visit.REMOVE
    })
    expect(visits).toBe(4)
    expect(CST.stringify(doc)).toBe(source`
      -  " foo"
      - "bar"
    `)
  })

  test('replace value with block scalar in seq', () => {
    const doc = cstDoc(source`
      -  " foo"
      - "foo"
      - "bar"
    `)
    let visits = 0
    CST.visit(doc, item => {
      visits += 1
      if (item.value) {
        const scalar = CST.resolveAsScalar(item.value)
        if (scalar?.value === 'foo')
          CST.setScalarValue(item.value, 'foo', { type: 'BLOCK_LITERAL' })
      }
    })
    expect(visits).toBe(4)
    expect(CST.stringify(doc)).toBe(source`
      -  " foo"
      - |-
        foo
      - "bar"
    `)
  })

  test('add item', () => {
    const doc = cstDoc(source`
      -  " foo"
      - "foo"
      - "bar"
    `)
    let visits = 0
    CST.visit(doc, (item, path) => {
      visits += 1
      if (CST.isScalar(item.value)) {
        const scalar = CST.resolveAsScalar(item.value)
        if (scalar?.value === 'foo') {
          const parent = CST.visit.parentCollection(doc, path)
          const idx = path[path.length - 1][1]
          const { indent } = item.value
          parent.items.splice(idx, 0, {
            start: item.start.slice(),
            value: CST.createScalarToken('hip', { indent })
          })
          return idx + 2
        }
      }
    })
    expect(visits).toBe(4)
    expect(CST.stringify(doc)).toBe(source`
      -  " foo"
      - hip
      - "foo"
      - "bar"
    `)
  })

  test('replace value with flow scalar in map', () => {
    const doc = cstDoc(source`
      - a:  A
        b: B\t#comment
        c: C
    `)
    let visits = 0
    CST.visit(doc, item => {
      visits += 1
      if (item.value) {
        const scalar = CST.resolveAsScalar(item.value)
        if (scalar?.value === 'B') {
          CST.setScalarValue(item.value, 'foo\n\nbar', { afterKey: !!item.key })
        }
      }
    })
    expect(visits).toBe(5)
    expect(CST.stringify(doc)).toBe(source`
      - a:  A
        b: foo


          bar\t#comment
        c: C
    `)
  })

  test('skip children', () => {
    const doc = cstDoc(source`
      - " foo"
      - [ foo, 13, 42 ]
      - "bar"
    `)
    let visits = 0
    CST.visit(doc, item => {
      visits += 1
      if (item.value?.type === 'flow-collection') return CST.visit.SKIP
    })
    expect(visits).toBe(4)
  })

  test('set next index', () => {
    const doc = cstDoc(source`
      - "foo"
      - [ foo, 13, 42 ]
      - "bar"
    `)
    let visits = 0
    CST.visit(doc, item => {
      visits += 1
      const scalar = CST.resolveAsScalar(item.value)
      if (scalar?.value === 'foo') return 2
    })
    expect(visits).toBe(3)
  })
})
