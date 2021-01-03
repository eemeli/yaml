import type { Token } from '../parse/parser.js'

function containsNewline(key: Token) {
  switch (key.type) {
    case 'alias':
    case 'scalar':
    case 'double-quoted-scalar':
    case 'single-quoted-scalar':
      return key.source.includes('\n')
    case 'flow-collection':
      for (const token of key.items) {
        switch (token.type) {
          case 'newline':
            return true
          case 'alias':
          case 'scalar':
          case 'double-quoted-scalar':
          case 'single-quoted-scalar':
          case 'flow-collection':
            if (containsNewline(token)) return true
            break
        }
      }
      return false
    default:
      return true
  }
}

export function validateImplicitKey(key: Token | null | undefined) {
  if (key) {
    if (containsNewline(key)) return 'single-line'
    // TODO: check 1024 chars
  }
  return null
}
