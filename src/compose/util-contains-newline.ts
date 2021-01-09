import type { Token } from '../parse/parser.js'

export function containsNewline(key: Token | null | undefined) {
  if (!key) return null
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
