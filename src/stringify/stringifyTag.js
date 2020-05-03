export function stringifyTag(doc, tag) {
  if ((doc.version || doc.options.version) === '1.0') {
    const priv = tag.match(/^tag:private\.yaml\.org,2002:([^:/]+)$/)
    if (priv) return '!' + priv[1]
    const vocab = tag.match(/^tag:([a-zA-Z0-9-]+)\.yaml\.org,2002:(.*)/)
    return vocab ? `!${vocab[1]}/${vocab[2]}` : `!${tag.replace(/^tag:/, '')}`
  }

  let p = doc.tagPrefixes.find(p => tag.indexOf(p.prefix) === 0)
  if (!p) {
    const dtp = doc.getDefaults().tagPrefixes
    p = dtp && dtp.find(p => tag.indexOf(p.prefix) === 0)
  }
  if (!p) return tag[0] === '!' ? tag : `!<${tag}>`
  const suffix = tag.substr(p.prefix.length).replace(
    /[!,[\]{}]/g,
    ch =>
      ({
        '!': '%21',
        ',': '%2C',
        '[': '%5B',
        ']': '%5D',
        '{': '%7B',
        '}': '%7D'
      }[ch])
  )
  return p.handle + suffix
}
