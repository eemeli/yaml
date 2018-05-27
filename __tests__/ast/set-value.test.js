import Node, { Type } from '../../src/ast/Node'
import parse from '../../src/ast/parse'
import { pretty, testSpec } from './common'
import CollectionItem from '../../src/ast/CollectionItem'

test('set value in collection', () => {
  const src = `- Mark McGwire
- Sammy Sosa
- Ken Griffey
` // spec 2.1
  const ast = parse(src)
  ast[0].contents[0].items[1].node.value = 'TEST\n'
  expect(String(ast)).toBe(src.replace(/Sammy Sosa/, 'TEST'))
})

test('replace entire contents', () => {
  const src = `- Mark McGwire
- Sammy Sosa
- Ken Griffey
` // spec 2.1
  const ast = parse(src)
  ast[0].contents[0].value = 'TEST: true\n'
  expect(String(ast)).toBe('TEST: true\n')
})

test('remove map key/value pair', () => {
  const src = `hr:  65    # Home runs
avg: 0.278 # Batting average
rbi: 147   # Runs Batted In
` // spec 2.2
  const ast = parse(src)
  ast[0].contents[0].items[2].value = ''
  ast[0].contents[0].items[3].value = ''
  expect(String(ast)).toBe(src.replace(/avg.*\n/, ''))
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
  const ast = parse(src)
  const seq = ast[0].contents[0].items[3].node
  const item = new CollectionItem(Type.SEQ_ITEM)
  item.context = seq.items[2].context
  item.value = '- "TEST"\n'
  seq.items.push(item)
  expect(String(ast)).toBe(`${src}  ${item.value}`)
})
