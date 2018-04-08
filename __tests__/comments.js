import resolve from '../src/index'
import { Type } from '../src/ast/Node'

describe('parse comments', () => {
  describe('body', () => {
    test('directives', () => {
      const src = '#comment\n%YAML 1.2 #comment\n---\nstring\n'
      const doc = resolve(src)[0]
      expect(doc.commentBefore).toBe('comment\ncomment')
      expect(String(doc)).toBe('#comment\n#comment\n%YAML 1.2\n---\nstring\n')
    })

    test('body start comments', () => {
      const src = '---\n#comment\n#comment\nstring\n'
      const doc = resolve(src)[0]
      expect(doc.contents.commentBefore).toBe('comment\ncomment')
      expect(String(doc)).toBe('#comment\n#comment\nstring\n')
    })

    test('body end comments', () => {
      const src = '\nstring\n#comment\n#comment\n'
      const doc = resolve(src)[0]
      expect(doc.comment).toBe('comment\ncomment')
      expect(String(doc)).toBe('string\n#comment\n#comment\n')
    })
  })

  describe('top-level scalar comments', () => {
    test('plain', () => {
      const src = '#c0\nvalue #c1\n#c2'
      const doc = resolve(src)[0]
      expect(doc.contents.commentBefore).toBe('c0')
      expect(doc.contents.comment).toBe('c1')
      expect(doc.comment).toBe('c2')
      expect(doc.contents.value).toBe('value')
    })

    test('"quoted"', () => {
      const src = '#c0\n"value" #c1\n#c2'
      const doc = resolve(src)[0]
      expect(doc.contents.commentBefore).toBe('c0')
      expect(doc.contents.comment).toBe('c1')
      expect(doc.comment).toBe('c2')
      expect(doc.contents.value).toBe('value')
    })

    test('block', () => {
      const src = '#c0\n>- #c1\n value\n#c2\n'
      const doc = resolve(src)[0]
      expect(doc.contents.commentBefore).toBe('c0')
      expect(doc.contents.comment).toBe('c1')
      expect(doc.comment).toBe('c2')
      expect(doc.contents.value).toBe('value')
    })
  })

  describe('seq entry comments', () => {
    test('plain', () => {
      const src = '#c0\n- value 1\n#c1\n\n- value 2\n\n#c2'
      const doc = resolve(src)[0]
      expect(doc.contents.items).toHaveLength(2)
      expect(doc.contents.commentBefore).toBe('c0')
      expect(doc.contents.items[1].commentBefore).toBe('c1')
      expect(doc.contents.comment).toBe('c2')
    })

    test('multiline', () => {
      const src = '- value 1\n#c0\n#c1\n\n#c2\n- value 2\n\n#c3\n#c4'
      const doc = resolve(src)[0]
      expect(doc.contents.items).toHaveLength(2)
      expect(doc.contents.items[1].commentBefore).toBe('c0\nc1\nc2')
      expect(doc.contents.comment).toBe('c3\nc4')
    })
  })

  describe('map entry comments', () => {
    test('plain', () => {
      const src = '#c0\nkey1: value 1\n#c1\n\nkey2: value 2\n\n#c2'
      const doc = resolve(src)[0]
      expect(doc.contents.items).toHaveLength(2)
      expect(doc.contents.commentBefore).toBe('c0')
      expect(doc.contents.items[1].commentBefore).toBe('c1')
      expect(doc.contents.comment).toBe('c2')
    })

    test('multiline', () => {
      const src = 'key1: value 1\n#c0\n#c1\n\n#c2\nkey2: value 2\n\n#c3\n#c4'
      const doc = resolve(src)[0]
      expect(doc.contents.items).toHaveLength(2)
      expect(doc.contents.items[1].commentBefore).toBe('c0\nc1\nc2')
      expect(doc.contents.comment).toBe('c3\nc4')
    })
  })
})

describe('stringify comments', () => {
  describe('single-line comments', () => {
    test('plain', () => {
      const src = 'string'
      const doc = resolve(src)[0]
      doc.contents.comment = 'comment'
      expect(String(doc)).toBe('string #comment\n')
    })

    test('"quoted"', () => {
      const src = '"string\\u0000"'
      const doc = resolve(src)[0]
      doc.contents.comment = 'comment'
      expect(String(doc)).toBe('"string\\0" #comment\n')
    })

    test('block', () => {
      const src = '>\nstring\n'
      const doc = resolve(src)[0]
      doc.contents.comment = 'comment'
      expect(String(doc)).toBe('> #comment\nstring\n')
    })
  })

  describe('multi-line comments', () => {
    test('plain', () => {
      const src = 'string'
      const doc = resolve(src)[0]
      doc.contents.comment = 'comment\nlines'
      expect(String(doc)).toBe('#comment\n#lines\nstring\n')
    })

    test('"quoted"', () => {
      const src = '"string\\u0000"'
      const doc = resolve(src)[0]
      doc.contents.comment = 'comment\nlines'
      expect(String(doc)).toBe('"string\\0"\n#comment\n#lines\n')
    })

    test('block', () => {
      const src = '>\nstring\n'
      const doc = resolve(src)[0]
      doc.contents.comment = 'comment\nlines'
      expect(String(doc)).toBe('> #comment lines\nstring\n')
    })
  })

  describe('document comments', () => {
    test('directive', () => {
      const src = 'string'
      const doc = resolve(src)[0]
      doc.directives.push({ type: Type.COMMENT, comment: 'comment' })
      expect(String(doc)).toBe('#comment\nstring\n')
    })
  })

  describe('seq entry comments', () => {
    test('plain', () => {
      const src = '- value 1\n- value 2\n'
      const doc = resolve(src)[0]
      doc.contents.items[0].commentBefore = 'c0'
      doc.contents.items[1].commentBefore = 'c1'
      doc.contents.comment = 'c2'
      expect(String(doc)).toBe('#c0\n- value 1\n#c1\n- value 2\n#c2\n')
    })

    test('multiline', () => {
      const src = '- value 1\n- value 2\n'
      const doc = resolve(src)[0]
      doc.contents.items[0].commentBefore = 'c0\nc1'
      doc.contents.items[1].commentBefore = '\nc2\n\nc3'
      doc.contents.comment = 'c4\nc5'
      expect(String(doc)).toBe(
`#c0
#c1
- value 1
#
#c2
#
#c3
- value 2
#c4
#c5
`)
    })
  })

  describe('map entry comments', () => {
    test('plain', () => {
      const src = 'key1: value 1\nkey2: value 2\n'
      const doc = resolve(src)[0]
      doc.contents.items[0].commentBefore = 'c0'
      doc.contents.items[1].commentBefore = 'c1'
      doc.contents.comment = 'c2'
      expect(String(doc)).toBe('#c0\nkey1: value 1\n#c1\nkey2: value 2\n#c2\n')
    })

    test('multiline', () => {
      const src = 'key1: value 1\nkey2: value 2\n'
      const doc = resolve(src)[0]
      doc.contents.items[0].commentBefore = 'c0\nc1'
      doc.contents.items[1].commentBefore = '\nc2\n\nc3'
      doc.contents.comment = 'c4\nc5'
      expect(String(doc)).toBe(
`#c0
#c1
key1: value 1
#
#c2
#
#c3
key2: value 2
#c4
#c5
`)
    })
  })
})
