function commonIndent(lines) {
  let tabCount = -1
  let spaceCount = -1
  for (const line of lines) {
    const [indent, tabs, spaces] = line.match(/^(\t*)( *)/)
    if (indent === line) continue
    if (!indent) return null
    const t = tabs.length
    if (tabCount < 0 || t < tabCount) tabCount = t
    if (t === tabCount) {
      const s = spaces.length
      if (spaceCount < 0 || s < spaceCount) spaceCount = s
    }
  }
  const tr = tabCount ? `\\t{0,${tabCount}}` : ''
  return new RegExp(`^${tr} {0,${spaceCount}}`)
}

/**
 * Template literal tag for dedenting code
 *
 * Strip the common indent of leading tabs & then spaces. Expects & drops
 * leading \n character and ignores indent level of empty lines.
 *
 * Inspired by the ftl template of [Project Fluent](https://projectfluent.org/)
 *
 * @param {string[]} strings
 * @returns {string}
 */
export function source(strings) {
  const lines = strings[0].split('\n').slice(1)
  const indent = commonIndent(lines)
  return indent
    ? lines.map(line => line.replace(indent, '')).join('\n')
    : lines.join('\n')
}
