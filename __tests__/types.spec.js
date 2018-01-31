import resolve from '../src/index'

describe('extended', () => {
  test('binary', () => {
    const src =
`canonical: !!binary "\
 R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5\
 OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+\
 +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC\
 AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs="
generic: !!binary |
 R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5
 OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+
 +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC
 AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs=
description:
 The binary value above is a tiny arrow encoded as a gif image.`

    const doc = resolve(src, { extended: true })[0]
    const canonical = doc.contents.items[0].value
    const generic = doc.contents.items[1].value
    expect(canonical).toBeInstanceOf(Uint8Array)
    expect(generic).toBeInstanceOf(Uint8Array)
    expect(canonical).toHaveLength(185)
    expect(generic).toHaveLength(185)
    let canonicalStr = ''
    let genericStr = ''
    for (let i = 0; i < canonical.length; ++i) canonicalStr += String.fromCharCode(canonical[i])
    for (let i = 0; i < generic.length; ++i) genericStr += String.fromCharCode(generic[i])
    expect(canonicalStr).toBe(genericStr)
    expect(canonicalStr.substr(0,3)).toBe('GIF')
  })
})

describe('merge <<', () => {
  const src = `---
- &CENTER { x: 1, y: 2 }
- &LEFT { x: 0, y: 2 }
- &BIG { r: 10 }
- &SMALL { r: 1 }

# All the following maps are equal:

- # Explicit keys
  x: 1
  y: 2
  r: 10
  label: center/big

- # Merge one map
  << : *CENTER
  r: 10
  label: center/big

- # Merge multiple maps
  << : [ *CENTER, *BIG ]
  label: center/big

- # Override
  << : [ *BIG, *LEFT, *SMALL ]
  x: 1
  label: center/big`

  test('example', () => {
    const doc = resolve(src)[0].toJSON()
    expect(doc).toHaveLength(8)
    for (let i = 4; i < doc.length; ++i) {
      expect(doc[i]).toMatchObject({ x: 1, y: 2, r: 10, label: 'center/big' })
    }
  })

  test('disabled merge', () => {
    const doc = resolve(src, { merge: false })[0].toJSON()
    expect(doc).toHaveLength(8)
    for (let i = 5; i < doc.length; ++i) {
      expect(doc[i]).toHaveProperty('<<')
    }
  })
})
