import { commonTests, testParse } from './common'

describe('parse simple array', () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '[ "one", 2, three four ]' }, commonTests[name])
    test(name, () => testParse(props))
  }
})

