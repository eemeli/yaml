import { Composer, Parser, parse } from '../index.js'

const src = `
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
 -\tII II
    II
`

describe('Input in parts', () => {
  const cases = [
    { title: 'LF line endings', src },
    { title: 'CRLF line endings', src: src.replace(/\n/g, '\r\n') }
  ]
  for (const { title, src } of cases)
    test(title, () => {
      const exp = [parse(src, { logLevel: 'error' })]
      for (let i = 1; i < src.length - 1; ++i) {
        const res: any[] = []
        const composer = new Composer(doc => res.push(doc.toJS()), {
          logLevel: 'error'
        })
        const parser = new Parser(composer.next)

        const start = src.substring(0, i)
        const end = src.substring(i)
        parser.parse(start, true)
        parser.parse(end, false)
        composer.end()

        try {
          expect(res).toMatchObject(exp)
        } catch (error) {
          console.log({ start, end, res })
          throw error
        }
      }
    })
})
