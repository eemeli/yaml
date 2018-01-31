import resolve from '../src/index'

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

test('merge <<', () => {
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
