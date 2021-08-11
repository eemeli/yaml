import { Composer, Document, Parser, parseDocument } from 'yaml'

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
"cc": "CC\n\n \\ "
? |
 dd
: >

  DD
   DD

  DD
? EE
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
    { title: 'LF line endings', src, nl: '\n' },
    { title: 'CRLF line endings', src: src.replace(/\n/g, '\r\n'), nl: '\r\n' }
  ]
  for (const { title, src, nl } of cases)
    test(title, () => {
      const doc = parseDocument(src, { logLevel: 'error' })
      const exp = [doc.toJS()]
      expect(exp[0]).toMatchObject({
        aa: 'AA AA',
        bb: 'BB BB',
        cc: 'CC\n ',
        'dd\n': '\nDD\n DD\n\nDD\n',
        EE: null,
        '[ ee, ff ]': { 'gg gg': ['GG'] },
        '{ hh }': ['HH', 'II\rII II']
      })
      const cb = [doc.commentBefore, doc.contents?.commentBefore]
      expect(cb).toMatchObject(['c0\n\nc1', `c2${nl}${nl}`])

      for (let i = 1; i < src.length - 1; ++i) {
        const res: Document.Parsed[] = []
        const composer = new Composer({ logLevel: 'error' })
        const parser = new Parser()
        const start = src.substring(0, i)
        const end = src.substring(i)
        for (const token of [
          ...parser.parse(start, true),
          ...parser.parse(end, false)
        ])
          for (const doc of composer.next(token)) res.push(doc)
        for (const doc of composer.end()) res.push(doc)

        try {
          expect(res.map(doc => doc.toJS())).toMatchObject(exp)
          expect(res[0].commentBefore).toBe(cb[0])
          expect(res[0].contents?.commentBefore).toBe(cb[1])
        } catch (error) {
          console.log({ start, end, res })
          throw error
        }
      }
    })
})
