import { commonTests, testParse } from './common'

describe('parse simple seq items', () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '- "value"' }, commonTests[name])
    test(name, () => testParse(props))
  }
})

