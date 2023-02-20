import { source } from '../_utils'
import * as YAML from 'yaml'

describe('parse comments', () => {
  describe('body', () => {
    test('directives', () => {
      const src = '#comment\n%YAML 1.2 #comment\n---\nstring\n'
      const doc = YAML.parseDocument(src)
      expect(doc.commentBefore).toBe('comment\ncomment')
      expect(String(doc)).toBe('#comment\n#comment\n\n%YAML 1.2\n---\nstring\n')
    })

    test('body start comments', () => {
      const src = source`
        ---
        #comment
        #comment
        string
      `
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      expect(doc.contents.commentBefore).toBe('comment\ncomment')
      expect(String(doc)).toBe(src)
    })

    test('body start comments with empty comment line', () => {
      const src = source`
        ---
        #comment
        #
        #comment
        string
      `
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      expect(doc.contents.commentBefore).toBe('comment\n \ncomment')
      expect(String(doc)).toBe(source`
        ---
        #comment
        #
        #comment
        string
      `)
    })

    test('body end comments', () => {
      const src = '\nstring\n#comment\n#comment\n'
      const doc = YAML.parseDocument(src)
      expect(doc.comment).toBe('comment\ncomment')
      expect(String(doc)).toBe('string\n\n#comment\n#comment\n')
    })
  })

  describe('top-level scalar comments', () => {
    test('plain', () => {
      const src = '#c0\nvalue #c1\n#c2'
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      expect(doc.contents.commentBefore).toBe('c0')
      expect(doc.contents.comment).toBe('c1')
      expect(doc.comment).toBe('c2')
      expect(doc.contents.value).toBe('value')
      expect(doc.contents.range).toMatchObject([4, 9, 14])
    })

    test('"quoted"', () => {
      const src = '#c0\n"value" #c1\n#c2'
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      expect(doc.contents.commentBefore).toBe('c0')
      expect(doc.contents.comment).toBe('c1')
      expect(doc.comment).toBe('c2')
      expect(doc.contents.value).toBe('value')
      expect(doc.contents.range).toMatchObject([4, 11, 16])
    })

    test('block', () => {
      const src = '#c0\n>- #c1\n value\n#c2\n'
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      expect(doc.contents.commentBefore).toBe('c0')
      expect(doc.contents.comment).toBe('c1')
      expect(doc.comment).toBe('c2')
      expect(doc.contents.value).toBe('value')
      expect(doc.contents.range).toMatchObject([4, 18, 18])
    })
  })

  describe('seq entry comments', () => {
    test('plain', () => {
      const src = source`
        #c0
        - value 1
          #c1

        - value 2

        #c2
      `
      const doc = YAML.parseDocument(src)
      expect(doc).toMatchObject({
        contents: {
          items: [
            { commentBefore: 'c0', value: 'value 1', comment: 'c1' },
            { value: 'value 2' }
          ],
          range: [4, 31, 31]
        },
        comment: 'c2'
      })
    })

    test('multiline', () => {
      const src = source`
        - value 1
          #c0
        #c1

        #c2
        - value 2

        #c3
        #c4
      `
      const doc = YAML.parseDocument(src)
      expect(doc).toMatchObject({
        contents: {
          items: [{ comment: 'c0' }, { commentBefore: 'c1\n\nc2' }]
        },
        comment: 'c3\nc4'
      })
    })
  })

  describe('map entry comments', () => {
    test('plain', () => {
      const src = source`
        #c0
        key1: value 1
          #c1

        key2: value 2

        #c2
      `
      const doc = YAML.parseDocument(src)
      expect(doc).toMatchObject({
        contents: {
          items: [
            { key: { commentBefore: 'c0' }, value: { comment: 'c1' } },
            { key: {}, value: {} }
          ]
        },
        comment: 'c2'
      })
    })

    test('multiline', () => {
      const src = source`
        key1: value 1
          #c0
        #c1

        #c2
        key2: value 2

        #c3
        #c4
      `
      const doc = YAML.parseDocument(src)
      expect(doc).toMatchObject({
        contents: {
          items: [
            { value: { comment: 'c0' } },
            { key: { commentBefore: 'c1\n\nc2' } }
          ]
        },
        comment: 'c3\nc4'
      })
    })
  })

  describe('map-in-seq comments', () => {
    test('plain', () => {
      const src = source`
        #c0
        - #c1
          k1: v1
          #c2
          k2: v2 #c3
        #c4
          k3: v3
        #c5
      `
      const doc = YAML.parseDocument(src)
      expect(doc).toMatchObject({
        contents: {
          items: [
            {
              commentBefore: 'c0\nc1',
              items: [
                {},
                { key: { commentBefore: 'c2' }, value: { comment: 'c3' } },
                { key: { commentBefore: 'c4' } }
              ]
            }
          ]
        },
        comment: 'c5'
      })
      expect(String(doc)).toBe(source`
        #c0
        #c1
        - k1: v1
          #c2
          k2: v2 #c3
          #c4
          k3: v3

        #c5
      `)
    })
  })

  describe('seq-in-map comments', () => {
    test('plain', () => {
      const src = source`
        #c0
        k1: #c1
          - v1
        #c2
          - v2
          #c3
        k2:
          - v3 #c4
        #c5
      `
      const doc = YAML.parseDocument(src)
      expect(doc).toMatchObject({
        contents: {
          items: [
            {
              key: { commentBefore: 'c0', value: 'k1' },
              value: {
                commentBefore: 'c1',
                items: [{ value: 'v1' }, { commentBefore: 'c2', value: 'v2' }],
                comment: 'c3'
              }
            },
            {
              key: { value: 'k2' },
              value: { items: [{ value: 'v3', comment: 'c4' }] }
            }
          ]
        },
        comment: 'c5'
      })
      expect(String(doc)).toBe(source`
        #c0
        k1:
          #c1
          - v1
          #c2
          - v2
          #c3
        k2:
          - v3 #c4

        #c5
      `)
    })
  })

  describe('flow collection commens', () => {
    test('line comment after , in seq', () => {
      const doc = YAML.parseDocument<YAML.YAMLSeq, false>(source`
        [ a, #c0
          b #c1
        ]`)
      expect(doc.contents.items).toMatchObject([
        { value: 'a', comment: 'c0' },
        { value: 'b', comment: 'c1' }
      ])
    })

    test('line comment after , in map', () => {
      const doc = YAML.parseDocument<YAML.YAMLMap, false>(source`
        { a, #c0
          b: c, #c1
          d #c2
        }`)
      expect(doc.contents.items).toMatchObject([
        { key: { value: 'a', comment: 'c0' } },
        { key: { value: 'b' }, value: { value: 'c', comment: 'c1' } },
        { key: { value: 'd', comment: 'c2' } }
      ])
    })

    test('multi-line comments', () => {
      const doc = YAML.parseDocument<YAML.YAMLMap, false>('{ a,\n#c0\n#c1\nb }')
      expect(doc.contents.items).toMatchObject([
        { key: { value: 'a' } },
        { key: { commentBefore: 'c0\nc1', value: 'b' } }
      ])
    })
  })
})

describe('stringify comments', () => {
  describe('single-line comments', () => {
    test('plain', () => {
      const src = 'string'
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      doc.contents.comment = 'comment'
      expect(String(doc)).toBe('string #comment\n')
    })

    test('"quoted"', () => {
      const src = '"string\\u0000"'
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      doc.contents.comment = 'comment'
      expect(String(doc)).toBe('"string\\0" #comment\n')
    })

    test('block', () => {
      const src = '>\nstring\n'
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      doc.contents.comment = 'comment'
      expect(String(doc)).toBe('> #comment\nstring\n')
    })
  })

  describe('multi-line comments', () => {
    test('plain', () => {
      const src = 'string'
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      doc.contents.comment = 'comment\nlines'
      expect(String(doc)).toBe('string\n#comment\n#lines\n')
    })

    test('"quoted"', () => {
      const src = '"string\\u0000"'
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      doc.contents.comment = 'comment\nlines'
      expect(String(doc)).toBe('"string\\0"\n#comment\n#lines\n')
    })

    test('block', () => {
      const src = '>\nstring\n'
      const doc = YAML.parseDocument<YAML.Scalar, false>(src)
      doc.contents.comment = 'comment\nlines'
      expect(String(doc)).toBe('> #comment lines\nstring\n')
    })
  })

  describe('document comments', () => {
    test('directive', () => {
      const src = source`
        #c0
        ---
        string
      `
      const doc = YAML.parseDocument(src)
      expect(doc.commentBefore).toBe('c0')
      doc.commentBefore += '\nc1'
      expect(String(doc)).toBe(source`
        #c0
        #c1
        ---
        string
      `)
    })
  })

  describe('seq comments', () => {
    test('plain', () => {
      const src = '- value 1\n- value 2\n'
      const doc = YAML.parseDocument<YAML.YAMLSeq<YAML.Scalar>, false>(src)
      doc.contents.commentBefore = 'c0'
      doc.contents.items[0].commentBefore = 'c1'
      doc.contents.items[1].commentBefore = 'c2'
      doc.contents.comment = 'c3'
      expect(String(doc)).toBe(source`
        #c0
        #c1
        - value 1
        #c2
        - value 2
        #c3
      `)
    })

    test('multiline', () => {
      const src = '- value 1\n- value 2\n'
      const doc = YAML.parseDocument<YAML.YAMLSeq<YAML.Scalar>, false>(src)
      doc.contents.items[0].commentBefore = 'c0\nc1'
      doc.contents.items[1].commentBefore = ' \nc2\n\nc3'
      doc.contents.comment = 'c4\nc5'
      expect(String(doc)).toBe(source`
        #c0
        #c1
        - value 1
        #
        #c2

        #c3
        - value 2
        #c4
        #c5
      `)
    })

    test('seq-in-map', () => {
      const src = 'map:\n  - value 1\n  - value 2\n'
      const doc = YAML.parseDocument<
        YAML.YAMLMap<YAML.Scalar, YAML.YAMLSeq<YAML.Scalar>>,
        false
      >(src)
      doc.contents.items[0].key.commentBefore = 'c0'
      doc.contents.items[0].key.comment = 'c1'
      const seq = doc.contents.items[0].value!
      seq.commentBefore = 'c2'
      seq.items[0].commentBefore = 'c3'
      seq.items[1].commentBefore = 'c4'
      seq.comment = 'c5'
      expect(String(doc)).toBe(source`
        #c0
        map: #c1
          #c2
          #c3
          - value 1
          #c4
          - value 2
          #c5
        `)
    })

    test('custom stringifier', () => {
      const doc = YAML.parseDocument<YAML.YAMLSeq<YAML.Scalar>, false>(
        '- a\n- b\n'
      )
      doc.contents.commentBefore = 'c0'
      doc.contents.items[0].commentBefore = 'c1'
      doc.contents.items[1].commentBefore = 'c2\nc3'
      expect(doc.toString({ commentString: str => str.replace(/^/gm, '// ') }))
        .toBe(source`
        // c0
        // c1
        - a
        // c2
        // c3
        - b
      `)
    })
  })

  describe('map entry comments', () => {
    test('plain', () => {
      const src = 'key1: value 1\nkey2: value 2\n'
      const doc = YAML.parseDocument<
        YAML.YAMLMap<YAML.Scalar, YAML.Scalar>,
        false
      >(src)
      doc.contents.items[0].key.commentBefore = 'c0'
      doc.contents.items[1].key.commentBefore = 'c1'
      doc.contents.items[1].key.comment = 'c2'
      doc.contents.items[1].value!.spaceBefore = true
      doc.contents.comment = 'c3'
      expect(String(doc)).toBe(source`
        #c0
        key1: value 1
        #c1
        key2: #c2

          value 2
        #c3
      `)
    })

    test('multiline', () => {
      const src = 'key1: value 1\nkey2: value 2\n'
      const doc = YAML.parseDocument<
        YAML.YAMLMap<YAML.Scalar, YAML.Scalar>,
        false
      >(src)
      doc.contents.items[0].key.commentBefore = 'c0\nc1'
      doc.contents.items[1].key.commentBefore = ' \nc2\n\nc3'
      doc.contents.items[1].key.comment = 'c4\nc5'
      doc.contents.items[1].value!.spaceBefore = true
      doc.contents.items[1].value!.commentBefore = 'c6'
      doc.contents.comment = 'c7\nc8'
      expect(String(doc)).toBe(source`
        #c0
        #c1
        key1: value 1
        #
        #c2

        #c3
        key2:
          #c4
          #c5

          #c6
          value 2
        #c7
        #c8
      `)
    })

    test('indented comment on empty value with spaceBefore', () => {
      const src = source`
        key1:

          # comment
        key2: x
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(src)
    })

    test('comment after empty value with spaceBefore', () => {
      const src = source`
        key1:

        # comment
        key2: x
      `
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(src)
    })
  })

  describe('flow collection comments', () => {
    test('line comment after , in seq', () => {
      const doc = YAML.parseDocument(source`
        [ a, #c0
          b #c1
        ]`)
      expect(String(doc)).toBe(source`
        [
          a, #c0
          b #c1
        ]
      `)
    })

    test('line comment after , in map', () => {
      const doc = YAML.parseDocument(source`
        { a, #c0
          b: c, #c1
          d #c2
        }`)
      expect(String(doc)).toBe(source`
        {
          a, #c0
          b: c, #c1
          d #c2
        }
      `)
    })

    test('line comment after flow collection (eemeli/yaml#443)', () => {
      const doc = YAML.parseDocument(source`
        [ value1, value2 ] # comment
      `)
      expect(String(doc)).toBe(source`
        [ value1, value2 ] # comment
      `)
    })
  })
})

describe('blank lines', () => {
  describe('drop leading blank lines', () => {
    test('content', () => {
      const src = '\n\nstr\n'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('str\n')
    })

    test('content comment', () => {
      const src = '\n\n#cc\n \nstr\n'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('#cc\n\nstr\n')
    })

    test('directive', () => {
      const src = '\n\n%YAML 1.2\n---\nstr\n'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('%YAML 1.2\n---\nstr\n')
    })

    test('directive comment', () => {
      const src = '\n\n#cc\n%YAML 1.2\n---\nstr\n'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('#cc\n\n%YAML 1.2\n---\nstr\n')
    })
  })

  describe('drop trailing blank lines', () => {
    test('empty contents', () => {
      const src = '\n\n\n'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('null\n')
    })

    test('scalar contents', () => {
      const src = 'str\n\n\n'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('str\n')
    })

    test('seq contents', () => {
      const src = '- a\n- b\n\n\n'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('- a\n- b\n')
    })

    test('empty/comment contents', () => {
      const src = '#cc\n\n\n'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('#cc\n\nnull\n')
    })
  })

  test('between directive comment & directive', () => {
    const src = '#cc\n\n\n%YAML 1.2\n---\nstr\n'
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe('#cc\n\n%YAML 1.2\n---\nstr\n')
  })

  test('after leading comment', () => {
    const src = '#cc\n\n\nstr\n'
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe('#cc\n\nstr\n')
  })

  test('before first node in document with directives', () => {
    const doc = YAML.parseDocument<YAML.Scalar, false>('str\n')
    doc.contents.spaceBefore = true
    expect(doc.toString({ directives: true })).toBe('---\n\nstr\n')
  })

  test('between seq items', () => {
    const src = '- a\n\n- b\n\n\n- c\n'
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe('- a\n\n- b\n\n- c\n')
  })

  test('between seq items with leading comments', () => {
    const src = source`
      #A
      - a

      #B
      - b


      #C

      - c
    `
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe(source`
      #A
      - a

      #B
      - b

      #C

      - c
    `)
  })

  describe('not after block scalar with keep chomping', () => {
    const cases = [
      { name: 'in seq', src: '- |+\n  a\n\n- b\n' },
      { name: 'in map', src: 'a: |+\n  A\n\nb: B\n' },
      { name: 'in seq in map', src: 'a:\n  - |+\n    A\n\nb: B\n' }
    ]
    for (const { name, src } of cases) {
      test(name, () => {
        const doc = YAML.parseDocument<any>(src)
        expect(String(doc)).toBe(src)
        let it = doc.contents.items[1]
        if (it.key) it = it.key
        expect(it).not.toHaveProperty('spaceBefore', true)
        it.spaceBefore = true
        expect(String(doc)).toBe(src)
        it.commentBefore = '\n\n'
        expect(String(doc)).toBe(src)
      })
    }

    test('as contents', () => {
      const src = '|+\n  a\n\n#c\n'
      const doc = YAML.parseDocument(src)
      expect(doc).toMatchObject({
        comment: 'c',
        contents: { value: 'a\n\n' }
      })
      expect(String(doc)).toBe(src)
      doc.comment = '\n\nc'
      expect(String(doc)).toBe(src)
    })
  })

  test('before block map values', () => {
    const src = 'a:\n\n  1\nb:\n\n  #c\n  2\n'
    const doc = YAML.parseDocument(src)
    expect(doc.contents).toMatchObject({
      items: [
        {
          key: { value: 'a' },
          value: { value: 1, spaceBefore: true }
        },
        {
          key: { value: 'b' },
          value: { value: 2, commentBefore: 'c', spaceBefore: true }
        }
      ]
    })
    expect(String(doc)).toBe(src)
  })

  describe('after block value', () => {
    test('in seq', () => {
      const src = '- |\n a\n\n- >-\n b\n\n- |+\n c\n\n- d\n'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe('- |\n  a\n\n- >-\n  b\n\n- |+\n  c\n\n- d\n')
    })

    test('in map', () => {
      const src = 'A: |\n a\n\nB: >-\n b\n\nC: |+\n c\n\nD: d\n'
      const doc = YAML.parseDocument(src)
      expect(String(doc)).toBe(
        'A: |\n  a\n\nB: >-\n  b\n\nC: |+\n  c\n\nD: d\n'
      )
    })
  })

  describe('flow collections', () => {
    test('flow seq', () => {
      const src = '[1,\n\n2,\n3,\n\n4\n\n]'
      const doc = YAML.parseDocument(src)
      expect(doc.contents).toMatchObject({
        items: [
          { value: 1 },
          { value: 2, spaceBefore: true },
          { value: 3 },
          { value: 4, spaceBefore: true }
        ]
      })
      expect(String(doc)).toBe('[\n  1,\n\n  2,\n  3,\n\n  4\n]\n')
    })

    test('flow map', () => {
      const src = '{\n\na: 1,\n\nb: 2 }'
      const doc = YAML.parseDocument(src)
      expect(doc.contents).toMatchObject({
        items: [
          { key: { value: 'a', spaceBefore: true }, value: { value: 1 } },
          { key: { value: 'b', spaceBefore: true }, value: { value: 2 } }
        ]
      })
    })

    test('flow map value comments & spaces', () => {
      const src = '{\n  a:\n    #c\n    1,\n  b:\n\n    #d\n    2\n}\n'
      const doc = YAML.parseDocument(src)
      expect(doc.contents).toMatchObject({
        items: [
          {
            key: { value: 'a' },
            value: { value: 1, commentBefore: 'c' }
          },
          {
            key: { value: 'b' },
            value: { value: 2, commentBefore: 'd', spaceBefore: true }
          }
        ]
      })
      expect(String(doc)).toBe(src)
    })
  })

  test('blank line after less-indented comment (eemeli/yaml#91)', () => {
    const src = `
map:
  foo0:
    key2: value2

#   foo1:
#     key0: value0
#     key1: value1

  foo2:
    key3: value3`
    const doc = YAML.parseDocument(src)
    expect(doc.errors).toHaveLength(0)
    expect(doc.toJS()).toMatchObject({
      map: { foo0: { key2: 'value2' }, foo2: { key3: 'value3' } }
    })
  })

  describe('commented empty lines', () => {
    test('document comments with #', () => {
      const src = source`
        # c1
        #
        # c2

        value

        # c3
        #
        # c4
      `
      const doc = YAML.parseDocument(src)
      expect(doc).toMatchObject({
        commentBefore: ' c1\n \n c2',
        comment: ' c3\n \n c4'
      })
      expect(doc.toString()).toBe(source`
        # c1
        #
        # c2

        value

        # c3
        #
        # c4
      `)
    })

    test('document comments without #', () => {
      const src = source`
        # c1

        # c2

        value

        # c3

        # c4
      `
      const doc = YAML.parseDocument(src)
      expect(doc).toMatchObject({
        commentBefore: ' c1\n\n c2',
        comment: ' c3\n\n c4'
      })
      expect(doc.toString()).toBe(src)
    })

    test('map comments with #', () => {
      const src = source`
        key:
          # c1
          #
          # c2

          value

          # c3
          #
          # c4
      `
      const doc = YAML.parseDocument(src)
      expect(doc.contents).toMatchObject({
        items: [
          { value: { commentBefore: ' c1\n \n c2\n', comment: ' c3\n \n c4' } }
        ]
      })
      expect(doc.toString()).toBe(source`
        key:
          # c1
          #
          # c2

          value
          # c3
          #
          # c4
      `)
    })

    test('map comments without #', () => {
      const src = source`
        key:
          # c1

          # c2

          value

          # c3

          # c4
      `
      const doc = YAML.parseDocument(src)
      expect(doc.contents).toMatchObject({
        items: [
          { value: { commentBefore: ' c1\n\n c2\n', comment: ' c3\n\n c4' } }
        ]
      })
      expect(doc.toString()).toBe(source`
        key:
          # c1

          # c2

          value
          # c3

          # c4
      `)
    })

    test('seq comments with #', () => {
      const src = source`
        # c1
        #
        # c2
        - v1
          # c3
          #
        # c4
        - v2
      `
      const doc = YAML.parseDocument(src)
      expect(doc.contents).toMatchObject({
        items: [
          { commentBefore: ' c1\n \n c2', comment: ' c3\n ' },
          { commentBefore: ' c4' }
        ]
      })
      expect(doc.toString()).toBe(source`
        # c1
        #
        # c2
        - v1
          # c3
          #
        # c4
        - v2
      `)
    })

    test('seq comments without #', () => {
      const src = source`
        # c1

        # c2
        - v1
          # c3

        # c4
        - v2
      `
      const doc = YAML.parseDocument(src)
      expect(doc.contents).toMatchObject({
        items: [
          { commentBefore: ' c1\n\n c2', comment: ' c3' },
          { commentBefore: ' c4', spaceBefore: true }
        ]
      })
      expect(doc.toString()).toBe(source`
        # c1

        # c2
        - v1 # c3

        # c4
        - v2
      `)
    })
  })

  describe('newlines as comments', () => {
    test('seq', () => {
      const doc = YAML.parseDocument<YAML.YAMLSeq<YAML.Scalar>, false>(
        '- v1\n- v2\n'
      )
      const [v1, v2] = doc.contents.items
      v1.commentBefore = '\n'
      v1.comment = '\n'
      v2.commentBefore = '\n'
      v2.comment = '\n'
      expect(doc.toString()).toBe(source`

        - v1


        - v2

      `)
    })

    test('map', () => {
      const doc = YAML.parseDocument<
        YAML.YAMLMap<YAML.Scalar, YAML.Scalar>,
        false
      >('k1: v1\nk2: v2')
      const [p1, p2] = doc.contents.items
      p1.key.commentBefore = '\n'
      p1.value!.commentBefore = '\n'
      p1.value!.comment = '\n'
      p2.key.commentBefore = '\n'
      p2.value!.commentBefore = '\n'
      p2.value!.comment = '\n'
      expect(doc.toString()).toBe(source`

        k1:

          v1


        k2:

          v2

      `)
    })
  })

  test('eemeli/yaml#277', () => {
    const src = source`
      environment:
        ### SESSION START ###
        A: "true"
        B: "true"
        ### SESSION END ###

        ### ANOTHER SESSION START ###
        C: "true"
        D: "true"
        ### ANOTHER SESSION END ###

    `
    const doc = YAML.parseDocument(src)
    expect(doc.toString()).toBe(src)
  })
})

describe('eemeli/yaml#18', () => {
  test('reported', () => {
    const src = `test1:
  foo:
    #123
    bar: 1\n`
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe(src)
  })

  test('minimal', () => {
    const src = `foo:\n  #123\n  bar: baz\n`
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe(src)
  })
})

describe('eemeli/yaml#28', () => {
  test('reported', () => {
    const src = `# This comment is ok
entryA:
  - foo

entryB:
  - bar # bar comment

# Ending comment
# Ending comment 2\n`
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe(`# This comment is ok
entryA:
  - foo

entryB:
  - bar # bar comment

# Ending comment
# Ending comment 2\n`)
  })

  test('collection end comment', () => {
    const src = `a: b #c\n#d\n`
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe(`a: b #c\n\n#d\n`)
  })

  test('blank line after seq in map', () => {
    const src = `a:
  - aa

b:
  - bb

c: cc\n`
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe(src)
  })

  test('blank line after map in seq', () => {
    const src = `- a: aa

- b: bb
  c: cc

- d: dd\n`
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe(src)
  })
})

describe('collection end comments', () => {
  test('seq in seq', () => {
    const src = source`
      #0
      - - a
        - b
        #1

      #2
      - d
    `
    const doc = YAML.parseDocument(src)
    expect(doc.contents).toMatchObject({
      items: [
        { items: [{ value: 'a' }, { value: 'b' }], comment: '1\n\n2' },
        { value: 'd' }
      ]
    })
    expect(String(doc)).toBe(source`
      #0
      - - a
        - b
        #1

        #2
      - d
    `)
  })

  test('map in seq', () => {
    const src = source`
      #0
      - a: 1
        b: 2
        #1

      #2
      - d
    `
    const doc = YAML.parseDocument(src)
    expect(doc.contents).toMatchObject({
      items: [
        {
          items: [
            { key: { value: 'a' }, value: { value: 1 } },
            { key: { value: 'b' }, value: { value: 2 } }
          ],
          comment: '1\n\n2'
        },
        { value: 'd' }
      ]
    })
    expect(String(doc)).toBe(source`
      #0
      - a: 1
        b: 2
        #1

        #2
      - d
    `)
  })

  test('seq in map', () => {
    const src = source`
      #0
      a:
        - b
        - c
        #1

      #2
      d: 1
    `
    const doc = YAML.parseDocument(src)
    expect(doc.contents).toMatchObject({
      items: [
        {
          key: { value: 'a' },
          value: { items: [{ value: 'b' }, { value: 'c' }], comment: '1\n\n2' }
        },
        { key: { value: 'd' }, value: { value: 1 } }
      ]
    })
    expect(String(doc)).toBe(source`
      #0
      a:
        - b
        - c
        #1

        #2
      d: 1
    `)
  })

  test('map in map', () => {
    const src = source`
      #0
      a:
        b: 1
        c: 2
        #1

      #2
      d: 1
    `
    const doc = YAML.parseDocument(src)
    expect(doc.contents).toMatchObject({
      items: [
        {
          key: { value: 'a' },
          value: {
            items: [
              { key: { value: 'b' }, value: { value: 1 } },
              { key: { value: 'c' }, value: { value: 2 } }
            ],
            comment: '1\n\n2'
          }
        },
        { key: { value: 'd' }, value: { value: 1 } }
      ]
    })
    expect(String(doc)).toBe(source`
      #0
      a:
        b: 1
        c: 2
        #1

        #2
      d: 1
    `)
  })

  test('indented seq in map in seq', () => {
    const src = `#0
a:
  #1
  - b:
      - c

  #2
  - e\n`
    const doc = YAML.parseDocument(src)
    expect(doc.contents).toMatchObject({
      items: [
        {
          key: { value: 'a' },
          value: {
            commentBefore: '1',
            items: [
              {
                items: [
                  {
                    key: { value: 'b' },
                    value: { items: [{ value: 'c' }] }
                  }
                ]
              },
              { spaceBefore: true, commentBefore: '2', value: 'e' }
            ]
          }
        }
      ]
    })
    expect(String(doc)).toBe(src)
  })
})
