import parse from '../../src/cst/parse'
import { charPosToLineCol } from '../../src/cst/parse'

describe('lineOffsets', () => {
  test('no lineOffsets by default', () => {
    const src = '- foo\n- bar\n'
    const cst = parse(src)
    expect(cst.lineOffsets).not.toBeDefined()
  })

  test('lineOffsets included when explicitly requested', () => {
    const src = '- foo\n- bar\n'
    const cst = parse(src, { computeLineOffsets: true })
    expect(cst.lineOffsets).toBeDefined()
    expect(cst.lineOffsets).toMatchObject([0, 6, 12])
  })

  test('lineOffsets for empty document', () => {
    const src = ''
    const cst = parse(src, { computeLineOffsets: true })
    expect(cst.lineOffsets).toBeDefined()
    expect(cst.lineOffsets).toMatchObject([0])
  })

  test('lineOffsets for multiple documents', () => {
    const src = 'foo\n...\nbar\n'
    const cst = parse(src, { computeLineOffsets: true })
    expect(cst.lineOffsets).toBeDefined()
    expect(cst.lineOffsets).toMatchObject([0, 4, 8, 12])
  })

  test('lineOffsets for malformed document', () => {
    const src = '- foo\n\t- bar\n'
    const cst = parse(src, { computeLineOffsets: true })
    expect(cst).toHaveLength(1)
    expect(cst.lineOffsets).toBeDefined()
    expect(cst.lineOffsets).toMatchObject([0, 6, 13])
  })

  test('offset conversion to line and col', () => {
    const src = '- foo\n- bar\n'
    const cst = parse(src, { computeLineOffsets: true })
    expect(charPosToLineCol()).toMatchObject({
      line: undefined,
      col: undefined
    })
    expect(charPosToLineCol(0)).toMatchObject({
      line: undefined,
      col: undefined
    })
    expect(charPosToLineCol(1)).toMatchObject({
      line: undefined,
      col: undefined
    })
    expect(charPosToLineCol(-1, cst.lineOffsets)).toMatchObject({
      line: undefined,
      col: undefined
    })
    expect(charPosToLineCol(0, cst.lineOffsets)).toMatchObject({
      line: 0,
      col: 0
    })
    expect(charPosToLineCol(1, cst.lineOffsets)).toMatchObject({
      line: 0,
      col: 1
    })
    expect(charPosToLineCol(2, cst.lineOffsets)).toMatchObject({
      line: 0,
      col: 2
    })
    expect(charPosToLineCol(5, cst.lineOffsets)).toMatchObject({
      line: 0,
      col: 5
    })
    expect(charPosToLineCol(6, cst.lineOffsets)).toMatchObject({
      line: 1,
      col: 0
    })
    expect(charPosToLineCol(7, cst.lineOffsets)).toMatchObject({
      line: 1,
      col: 1
    })
    expect(charPosToLineCol(11, cst.lineOffsets)).toMatchObject({
      line: 1,
      col: 5
    })
    expect(charPosToLineCol(12, cst.lineOffsets)).toMatchObject({
      line: 2,
      col: 0
    })
    expect(charPosToLineCol(13, cst.lineOffsets)).toMatchObject({
      line: undefined,
      col: undefined
    })
    expect(charPosToLineCol(Math.MAXINT, cst.lineOffsets)).toMatchObject({
      line: undefined,
      col: undefined
    })
  })
})
