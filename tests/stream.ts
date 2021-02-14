import { Composer, Document, Parser, parseDocument } from '../index.js'

const src = `
#c0\n \n
%YAML 1.2
#c1
---
#c2\n \n
aa: AA
 AA
'bb': 'BB
  BB'
"cc": "CC"
? |
 dd
: >

  DD
   DD

  DD
[ ee , ff ] : {
 "gg
   gg":[GG]
}
{hh}:
 - HH
 -\tII\rII
    II
`

describe('Input in parts', () => {
  const cases = [
    { title: 'LF line endings', src },
    { title: 'CRLF line endings', src: src.replace(/\n/g, '\r\n') }
  ]
  for (const { title, src } of cases)
    test(title, () => {
      const doc = parseDocument(src, { logLevel: 'error' })
      const exp = [doc.toJS()]
      expect(exp[0]).toMatchObject({
        aa: 'AA AA',
        bb: 'BB BB',
        cc: 'CC',
        'dd\n': '\nDD\n DD\n\nDD\n',
        '[ ee, ff ]': { 'gg gg': ['GG'] },
        '{ hh }': ['HH', 'II\rII II']
      })
      const cb = [doc.commentBefore, doc.contents.commentBefore]
      expect(cb).toMatchObject(['c0\n\nc1', 'c2'])

      for (let i = 1; i < src.length - 1; ++i) {
        const res: Document.Parsed[] = []
        const composer = new Composer(doc => res.push(doc), {
          logLevel: 'error'
        })
        const parser = new Parser(composer.next)

        const start = src.substring(0, i)
        const end = src.substring(i)
        parser.parse(start, true)
        parser.parse(end, false)
        composer.end()

        try {
          expect(res.map(doc => doc.toJS())).toMatchObject(exp)
          expect(res[0].commentBefore).toBe(cb[0])
          expect(res[0].contents.commentBefore).toBe(cb[1])
        } catch (error) {
          console.log({ start, end, res })
          throw error
        }
      }
    })
})
