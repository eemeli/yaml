import YAML from '../../src/index'
import { findLineOffsets, charPosToLineCol } from '../../src/cst/getLinePos'

describe('lineOffsets', () => {
  test('lineOffsets for empty document', () => {
    const src = ''
    const lineOffsets = findLineOffsets(src)
    expect(lineOffsets).toMatchObject([0])
  })

  test('lineOffsets for multiple documents', () => {
    const src = 'foo\n...\nbar\n'
    const lineOffsets = findLineOffsets(src)
    expect(lineOffsets).toMatchObject([0, 4, 8, 12])
  })

  test('lineOffsets for malformed document', () => {
    const src = '- foo\n\t- bar\n'
    const lineOffsets = findLineOffsets(src)
    expect(lineOffsets).toMatchObject([0, 6, 13])
  })

  test('offset conversion to line and col', () => {
    const src = '- foo\n- bar\n'
    const cst = YAML.parseCST(src)
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
    expect(charPosToLineCol(-1, cst)).toMatchObject({
      line: undefined,
      col: undefined
    })
    expect(charPosToLineCol(0, cst)).toMatchObject({
      line: 0,
      col: 0
    })
    expect(charPosToLineCol(1, cst)).toMatchObject({
      line: 0,
      col: 1
    })
    expect(charPosToLineCol(2, cst)).toMatchObject({
      line: 0,
      col: 2
    })
    expect(charPosToLineCol(5, cst)).toMatchObject({
      line: 0,
      col: 5
    })
    expect(charPosToLineCol(6, cst)).toMatchObject({
      line: 1,
      col: 0
    })
    expect(charPosToLineCol(7, cst)).toMatchObject({
      line: 1,
      col: 1
    })
    expect(charPosToLineCol(11, cst)).toMatchObject({
      line: 1,
      col: 5
    })
    expect(charPosToLineCol(12, cst)).toMatchObject({
      line: 2,
      col: 0
    })
    expect(charPosToLineCol(13, cst)).toMatchObject({
      line: undefined,
      col: undefined
    })
    expect(charPosToLineCol(Math.MAXINT, cst)).toMatchObject({
      line: undefined,
      col: undefined
    })
    expect(cst[0].lineOffsets).toMatchObject([0, 6, 12])
  })
})
