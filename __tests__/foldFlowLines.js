import fold, { FOLD_FLOW, FOLD_QUOTED } from '../src/foldFlowLines'
import YAML from '../src/index'
import { strOptions } from '../src/schema/_string'

describe('plain', () => {
  const src = 'abc def ghi jkl mno pqr stu vwx yz\n'
  let onFold
  let options
  beforeEach(() => {
    onFold = jest.fn()
    options = { indentAtStart: 0, lineWidth: 10, minContentWidth: 0, onFold }
  })

  test('pass-through', () => {
    options.lineWidth = 40
    expect(fold(src, '', FOLD_FLOW, options)).toBe(src)
    expect(onFold).not.toHaveBeenCalled()
  })

  test('simple', () => {
    options.lineWidth = 20
    expect(fold(src, '', FOLD_FLOW, options)).toBe(
      'abc def ghi jkl mno\npqr stu vwx yz\n'
    )
    expect(onFold).toHaveBeenCalled()
  })

  test('multiple folds', () => {
    expect(fold(src, '', FOLD_FLOW, options)).toBe(
      'abc def\nghi jkl\nmno pqr\nstu vwx yz\n'
    )
    expect(onFold).toHaveBeenCalledTimes(1)
  })

  test('indent', () => {
    expect(fold(src, '  ', FOLD_FLOW, options)).toBe(
      'abc def\n  ghi jkl\n  mno pqr\n  stu vwx\n  yz\n'
    )
  })

  test('indent > lineWidth', () => {
    const indent = '        '
    options.lineWidth = 7
    const i = '\n' + indent
    expect(fold(src, indent, FOLD_FLOW, options)).toBe(
      `abc def${i}ghi${i}jkl${i}mno${i}pqr${i}stu${i}vwx${i}yz\n`
    )
  })

  test('indent > lineWidth, with minContentWidth', () => {
    const indent = '        '
    options.lineWidth = 7
    options.minContentWidth = 7
    const i = '\n' + indent
    expect(fold(src, indent, FOLD_FLOW, options)).toBe(
      `abc def${i}ghi jkl${i}mno pqr${i}stu vwx${i}yz\n`
    )
  })

  test('positive indentAtStart', () => {
    options.indentAtStart = 8
    expect(fold(src, '', FOLD_FLOW, options)).toBe(
      'abc\ndef ghi\njkl mno\npqr stu\nvwx yz\n'
    )
  })

  test('negative indentAtStart', () => {
    options.indentAtStart = -8
    expect(fold(src, '', FOLD_FLOW, options)).toBe(
      'abc def ghi jkl\nmno pqr\nstu vwx yz\n'
    )
  })

  test('doubled spaces', () => {
    const src2 = 'abc  def  ghi  jkl  mno  pqr  stu  vwx  yz\n'
    expect(fold(src2, '', FOLD_FLOW, options)).toBe(src2)
    expect(onFold).not.toHaveBeenCalled()
  })
})

describe('double-quoted', () => {
  const src = '"abc def ghi jkl mnopqrstuvwxyz\n"'
  let onFold
  let options
  beforeEach(() => {
    onFold = jest.fn()
    options = {
      indent: '',
      indentAtStart: 0,
      lineWidth: 10,
      minContentWidth: 0,
      mode: FOLD_QUOTED,
      onFold
    }
  })

  test('pass-through', () => {
    options.lineWidth = 40
    expect(fold(src, '', FOLD_QUOTED, options)).toBe(src)
    expect(onFold).not.toHaveBeenCalled()
  })

  test('simple', () => {
    options.lineWidth = 20
    expect(fold(src, '', FOLD_QUOTED, options)).toBe(
      '"abc def ghi jkl\nmnopqrstuvwxyz\n"'
    )
    expect(onFold).toHaveBeenCalled()
  })

  test('multiple folds', () => {
    expect(fold(src, '', FOLD_QUOTED, options)).toBe(
      '"abc def\nghi jkl\nmnopqrstu\\\nvwxyz\n"'
    )
    expect(onFold).toHaveBeenCalledTimes(1)
  })

  test('short lineWidth', () => {
    options.lineWidth = 3
    expect(fold(src, '', FOLD_QUOTED, options)).toBe(
      '"a\\\nbc\ndef\nghi\njkl\nmn\\\nop\\\nqr\\\nst\\\nuv\\\nwx\\\nyz\n"'
    )
  })

  test('doubled spaces', () => {
    const src2 = '"abc  def  ghi  jkl  mno  pqr  stu  vwx  yz\n"'
    options.lineWidth = 9
    expect(fold(src2, '', FOLD_QUOTED, options)).toBe(
      '"abc  de\\\nf  ghi  \\\njkl  mno  \\\npqr  stu  \\\nvwx  yz\n"'
    )
  })

  test('terminal whitespace', () => {
    const src2 = '" \t \t \t \t \tnext \t"'
    expect(fold(src2, '', FOLD_QUOTED, options)).toBe(
      '" \t \t \t \t \t\\\nnext \t"'
    )
  })
})

describe('end-to-end', () => {
  let origFoldOptions

  beforeAll(() => {
    origFoldOptions = strOptions.fold
    strOptions.fold = {
      lineWidth: 20,
      minContentWidth: 0
    }
  })

  afterAll(() => {
    strOptions.fold = origFoldOptions
  })

  test('more-indented folded block', () => {
    const src = `> # comment with an excessive length that won't get folded
Text on a line that
should get folded
with a line width of
20 characters.

  Indented text
  that appears to be
folded but is not.

  Text that is prevented from folding due to being more-indented.

Unfolded paragraph.\n`
    const doc = YAML.parseDocuments(src)[0]
    expect(doc.contents.value).toBe(
      `Text on a line that should get folded with a line width of 20 characters.

  Indented text
  that appears to be
folded but is not.

  Text that is prevented from folding due to being more-indented.

Unfolded paragraph.\n`
    )
    expect(String(doc)).toBe(src)
  })

  test('plain string', () => {
    const src = `- plain value with
  enough length to
  fold twice
- plain with comment # that won't get folded\n`
    const doc = YAML.parseDocuments(src)[0]
    expect(doc.contents.items[0].value).toBe(
      'plain value with enough length to fold twice'
    )
    expect(doc.contents.items[1].value).toBe('plain with comment')
    expect(String(doc)).toBe(src)
  })
})
