import Scalar from '../../src/ast/Scalar'

describe('constructor', () => {
  test('sets src', () => {
    const src = 'src'
    const s = new Scalar(src)
    expect(s.src).toBe(src)
  })
})

describe('parse "quoted"', () => {
  test('at end', () => {
    const src = '"value"'
    const s = new Scalar(src)
    const end = s.parse(0)
    expect(end).toBe(src.length)
    expect(s).toMatchSnapshot()
  })
})
