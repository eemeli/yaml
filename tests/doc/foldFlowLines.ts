import * as YAML from 'yaml'
import { foldFlowLines as fold, FoldOptions } from 'yaml/util'
import { source } from '../_utils'

const FOLD_FLOW = 'flow'
const FOLD_QUOTED = 'quoted'

describe('plain', () => {
  const src = 'abc def ghi jkl mno pqr stu vwx yz\n'
  let onFold: jest.Mock
  let options: FoldOptions
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
  let onFold: jest.Mock
  let options: FoldOptions
  beforeEach(() => {
    onFold = jest.fn()
    options = {
      indentAtStart: 0,
      lineWidth: 10,
      minContentWidth: 0,
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

  test('escape longer than lineWidth', () => {
    const src2 = `"foo\\U01234567"`
    expect(fold(src2, '', FOLD_QUOTED, options)).toBe(src2)
  })

  describe('Folding double-quoted strings', () => {
    describe('eemeli/yaml#48: Split \\" escape in double-quoted string', () => {
      test('minimal', () => {
        const src2 = '"01234567\\""'
        expect(fold(src2, '', FOLD_QUOTED, options)).toBe('"01234567\\\n\\""')
        const src3 = '"012345678\\""'
        expect(fold(src3, '', FOLD_QUOTED, options)).toBe('"012345678\\\n\\""')
      })

      test('reported', () => {
        const x =
          '{"module":"database","props":{"databaseType":"postgresql"},"extra":{},"foo":"bar\'"}'
        const str = YAML.stringify({ x })
        const doc = YAML.parseDocument<any>(str)
        expect(doc.errors).toHaveLength(0)
        expect(doc.contents.items[0].value.value).toBe(x)
      })
    })

    describe('eemeli/yaml#57', () => {
      test('minimal', () => {
        const str = `"0123\\"\\\\ '"`
        expect(fold(str, '', FOLD_QUOTED, options)).toBe(`"0123\\"\\\\\n'"`)
      })

      test('reported', () => {
        const key2 = `!""""""""""""""""""""""""""""""""""#"\\ '`
        const str = YAML.stringify([{ key2 }])
        const res = YAML.parse(str)
        expect(res[0].key2).toBe(key2)
      })
    })

    describe('eemeli/yaml#59', () => {
      test('minimal', () => {
        const str = `"######\\\\P#"`
        expect(fold(str, '', FOLD_QUOTED, options)).toBe(`"######\\\\\\\nP#"`)
      })

      test('reported', () => {
        const value =
          '>####################################"##########################\'####\\P#'
        const str = YAML.stringify({ key: [[value]] })
        const doc = YAML.parseDocument<any>(str)
        expect(doc.errors).toHaveLength(0)
        expect(doc.contents.items[0].value.items[0].items[0].value).toBe(value)
      })
    })

    describe('awslabs/cdk8s#494', () => {
      test('slash', () => {
        const str = `"1234567\\\\ab"`
        expect(fold(str, '', FOLD_QUOTED, options)).toBe(`"1234567\\\n\\\\ab"`)
      })

      test('null', () => {
        const str = `"1234567\\\0ab"`
        expect(fold(str, '', FOLD_QUOTED, options)).toBe(`"1234567\\\n\\\0ab"`)
      })

      test('space', () => {
        const str = `"1234567\\ ab"`
        expect(fold(str, '', FOLD_QUOTED, options)).toBe(`"1234567\\\n\\ ab"`)
      })
    })
  })

  describe('Folding input with excessive start indentation - eemeli/yaml#196', () => {
    test('quoted', () => {
      options.indentAtStart = 6
      options.minContentWidth = 6
      expect(fold('"ab cd ef gh"', ' ', FOLD_QUOTED, options)).toBe(
        '\n "ab cd ef\n gh"'
      )
    })

    test('plain', () => {
      options.indentAtStart = 6
      options.minContentWidth = 6
      expect(fold('ab cd ef gh', ' ', FOLD_FLOW, options)).toBe(
        '\n ab cd ef\n gh'
      )
    })

    test('reported', () => {
      const input = {
        testgljrisgjsrligjsrligsjrglisrjgrligjsligrjglisjgrlijgsrilgsejrfiwlahflirgjaelfjafil:
          '&cLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed nibh ac metus elementum venenatis eu vitae diam. Etiam tristique suscipit mauris. Donec pulvinar sed nunc a gravida. Morbi nulla lacus, gravida eu elementum id, ultricies nec ipsum. Cras bibendum tellus ut mollis malesuada. Maecenas eleifend felis at fermentum hendrerit. Nulla porta vitae erat eget faucibus. Sed egestas viverra magna ac vulputate. Suspendisse vel posuere mauris, accumsan dapibus libero. Curabitur bibendum tellus in ex ultricies, quis tempus magna luctus. Maecenas maximus orci est, id fringilla lorem gravida sit amet. Pellentesque a rutrum lorem. Vestibulum ante ipsum primis in faucibus orci.'
      }
      expect(YAML.stringify(input)).toBe(
        `testgljrisgjsrligjsrligsjrglisrjgrligjsligrjglisjgrlijgsrilgsejrfiwlahflirgjaelfjafil:
  "&cLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed nibh ac
  metus elementum venenatis eu vitae diam. Etiam tristique suscipit mauris.
  Donec pulvinar sed nunc a gravida. Morbi nulla lacus, gravida eu elementum id,
  ultricies nec ipsum. Cras bibendum tellus ut mollis malesuada. Maecenas
  eleifend felis at fermentum hendrerit. Nulla porta vitae erat eget faucibus.
  Sed egestas viverra magna ac vulputate. Suspendisse vel posuere mauris,
  accumsan dapibus libero. Curabitur bibendum tellus in ex ultricies, quis
  tempus magna luctus. Maecenas maximus orci est, id fringilla lorem gravida sit
  amet. Pellentesque a rutrum lorem. Vestibulum ante ipsum primis in faucibus
  orci."\n`
      )
    })
  })
})

describe('block scalar', () => {
  test('eemeli/yaml#422', () => {
    const obj = {
      'nginx.ingress.kubernetes.io/configuration-snippet': source`
          location ~* ^/sites/aaaaaaa.aa/files/(.+) {
            return 302 https://process.aaaaaaa.aa/sites/aaaaaaa.aa/files/$1;
          }
          location ~* ^/partner-application/cls/(.+) {
            return 301 https://process.aaaaaaa.aa/partner-application/cls/$1$is_args$args;
          }
          `
    }
    expect(YAML.stringify(obj)).toBe(source`
        nginx.ingress.kubernetes.io/configuration-snippet: >
          location ~* ^/sites/aaaaaaa.aa/files/(.+) {
            return 302 https://process.aaaaaaa.aa/sites/aaaaaaa.aa/files/$1;
          }

          location ~* ^/partner-application/cls/(.+) {
            return 301 https://process.aaaaaaa.aa/partner-application/cls/$1$is_args$args;
          }
      `)
  })
})

describe('end-to-end', () => {
  const foldOptions = { lineWidth: 20, minContentWidth: 0 }

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
    const doc = YAML.parseDocument<YAML.Scalar, false>(src)
    expect(doc.contents.value).toBe(
      `Text on a line that should get folded with a line width of 20 characters.

  Indented text
  that appears to be
folded but is not.

  Text that is prevented from folding due to being more-indented.

Unfolded paragraph.\n`
    )
    expect(doc.toString(foldOptions)).toBe(src)
  })

  test('eemeli/yaml#55', () => {
    const str = ' first more-indented line\nnext line\n'
    const ys = YAML.stringify(str, foldOptions)
    expect(ys).toBe('>1\n first more-indented line\nnext line\n')
  })

  test('plain string', () => {
    const src = `- plain value with
  enough length to
  fold twice
- plain with comment # that won't get folded\n`
    const doc = YAML.parseDocument<YAML.YAMLSeq<YAML.Scalar>, false>(src)
    expect(doc.contents.items[0].value).toBe(
      'plain value with enough length to fold twice'
    )
    expect(doc.contents.items[1].value).toBe('plain with comment')
    expect(doc.toString(foldOptions)).toBe(src)
  })

  test('long line width', () => {
    const src = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. In laoreet massa eros, dignissim aliquam nunc elementum sit amet. Mauris pulvinar nunc eget ante sodales viverra. Vivamus quis convallis sapien, ut auctor magna. Cras volutpat erat eu lacus luctus facilisis. Aenean sapien leo, auctor sed tincidunt at, scelerisque a urna. Nunc ullamcorper, libero non mollis aliquet, nulla diam lobortis neque, ac rutrum dui nibh iaculis lectus. Aenean lobortis interdum arcu eget sollicitudin.

Duis quam enim, ultricies a enim non, tincidunt lobortis ipsum. Mauris condimentum ultrices eros rutrum euismod. Fusce et mi eget quam dapibus blandit. Maecenas sodales tempor euismod. Phasellus vulputate purus felis, eleifend ullamcorper tortor semper sit amet. Sed nunc quam, iaculis et neque sit amet, consequat egestas lectus. Aenean dapibus lorem sed accumsan porttitor. Curabitur eu magna congue, mattis urna ac, lacinia eros. In in iaculis justo, nec faucibus enim. Fusce id viverra purus, nec ultricies mi. Aliquam eu risus risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Suspendisse potenti. \n`

    const exp = `|
Lorem ipsum dolor sit amet, consectetur adipiscing elit. In laoreet massa eros, dignissim aliquam nunc elementum sit amet. Mauris pulvinar nunc eget ante sodales viverra. Vivamus quis convallis sapien, ut auctor magna. Cras volutpat erat eu lacus luctus facilisis. Aenean sapien leo, auctor sed tincidunt at, scelerisque a urna. Nunc ullamcorper, libero non mollis aliquet, nulla diam lobortis neque, ac rutrum dui nibh iaculis lectus. Aenean lobortis interdum arcu eget sollicitudin.

Duis quam enim, ultricies a enim non, tincidunt lobortis ipsum. Mauris condimentum ultrices eros rutrum euismod. Fusce et mi eget quam dapibus blandit. Maecenas sodales tempor euismod. Phasellus vulputate purus felis, eleifend ullamcorper tortor semper sit amet. Sed nunc quam, iaculis et neque sit amet, consequat egestas lectus. Aenean dapibus lorem sed accumsan porttitor. Curabitur eu magna congue, mattis urna ac, lacinia eros. In in iaculis justo, nec faucibus enim. Fusce id viverra purus, nec ultricies mi. Aliquam eu risus risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Suspendisse potenti. \n`

    for (const lineWidth of [1000, 0, -1])
      expect(YAML.stringify(src, { lineWidth })).toBe(exp)
  })
})
