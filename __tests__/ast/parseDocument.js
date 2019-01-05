import { parseDocument } from '../../src/index'
import { charPosToLineCol } from '../../src/cst/parse'

describe('lineOffsets', () => {
  test('no lineOffsets by default', () => {
    const src = '- foo\n- bar\n'
    const ast = parseDocument(src)
    expect(ast.contents).toBeDefined()
    expect(ast.lineOffsets).not.toBeDefined()
  })

  test('lineOffsets included when explicitly requested', () => {
    const src = '- foo\n- bar\n'
    const ast = parseDocument(src, { computeLineOffsets: true })
    expect(ast.contents).toBeDefined()
    expect(ast.lineOffsets).toBeDefined()
  })
})
