import { Type } from '../../src/constants'
import { parse } from '../../src/cst/parse'
import { CollectionItem } from '../../src/cst/CollectionItem'

test('set value in collection', () => {
  const src = `- Mark McGwire
- Sammy Sosa
- Ken Griffey
` // spec 2.1
  const cst = parse(src)
  cst[0].contents[0].items[1].node.value = 'TEST\n'
  expect(String(cst)).toBe(src.replace(/Sammy Sosa/, 'TEST'))
})

test('replace entire contents', () => {
  const src = `- Mark McGwire
- Sammy Sosa
- Ken Griffey
` // spec 2.1
  const cst = parse(src)
  cst[0].contents[0].value = 'TEST: true\n'
  expect(String(cst)).toBe('TEST: true\n')
})

test('remove map key/value pair', () => {
  const src = `hr:  65    # Home runs
avg: 0.278 # Batting average
rbi: 147   # Runs Batted In
` // spec 2.2
  const cst = parse(src)
  cst[0].contents[0].items[2].value = ''
  cst[0].contents[0].items[3].value = ''
  expect(String(cst)).toBe(src.replace(/avg.*\n/, ''))
})

test('add entry to seq', () => {
  const src = `american:
  - Boston Red Sox
  - Detroit Tigers
  - New York Yankees
national:
  - New York Mets
  - Chicago Cubs
  - Atlanta Braves
` // spec 2.3
  const cst = parse(src)
  const seq = cst[0].contents[0].items[3].node
  const item = new CollectionItem(Type.SEQ_ITEM)
  item.context = seq.items[2].context
  item.value = '- "TEST"\n'
  seq.items.push(item)
  expect(String(cst)).toBe(`${src}  ${item.value}`)
})
