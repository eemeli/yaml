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
})
