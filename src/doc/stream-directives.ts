import type { Document } from './Document.js'
import { listTagNames } from './listTagNames.js'

const escapeChars: Record<string, string> = {
  '!': '%21',
  ',': '%2C',
  '[': '%5B',
  ']': '%5D',
  '{': '%7B',
  '}': '%7D'
}

const escapeTagName = (tn: string) =>
  tn.replace(/[!,[\]{}]/g, ch => escapeChars[ch])

export class StreamDirectives {
  tags: Record<string, string> = { '!!': 'tag:yaml.org,2002:' }
  yaml: { version: '1.1' | '1.2' | undefined } = { version: undefined }

  static from(src: StreamDirectives) {
    const res = new StreamDirectives()
    Object.assign(res.tags, src.tags)
    Object.assign(res.yaml, src.yaml)
    return res
  }

  /**
   * @param onError - May be called even if the action was successful
   * @returns `true` on success
   */
  add(line: string, onError: (offset: number, message: string) => void) {
    const parts = line.trim().split(/[ \t]+/)
    const name = parts.shift()
    switch (name) {
      case '%TAG': {
        if (parts.length !== 2) {
          onError(0, '%TAG directive should contain exactly two parts')
          if (parts.length < 2) return false
        }
        const [handle, prefix] = parts
        this.tags[handle] = prefix
        return true
      }
      case '%YAML': {
        if (parts.length < 1) {
          onError(0, '%YAML directive should contain exactly one part')
          return false
        }
        const [version] = parts
        if (version === '1.1' || version === '1.2') {
          this.yaml.version = version
          return true
        } else {
          onError(6, `Unsupported YAML version ${version}`)
          return false
        }
      }
      default:
        onError(0, `Unknown directive ${name}`)
        return false
    }
  }

  /**
   * Resolves a tag, matching handles to those defined in %TAG directives.
   *
   * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
   *   `'!local'` tag, or `null` if unresolvable.
   */
  tagName(source: string, onError: (message: string) => void) {
    if (source === '!') return '!' // non-specific tag

    if (source[0] !== '!') {
      onError(`Not a valid tag: ${source}`)
      return null
    }

    if (source[1] === '<') {
      const verbatim = source.slice(2, -1)
      if (verbatim === '!' || verbatim === '!!') {
        onError(`Verbatim tags aren't resolved, so ${source} is invalid.`)
        return null
      }
      if (source[source.length - 1] !== '>')
        onError('Verbatim tags must end with a >')
      return verbatim
    }

    const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/) as string[]
    const prefix = this.tags[handle]
    if (prefix) return prefix + suffix
    if (handle === '!') return source // local tag

    onError(`Could not resolve tag: ${source}`)
    return null
  }

  /**
   * Given a fully resolved tag, returns its printable string form,
   * taking into account current tag prefixes and defaults.
   */
  tagString(tag: string) {
    for (const [handle, prefix] of Object.entries(this.tags)) {
      if (tag.startsWith(prefix))
        return handle + escapeTagName(tag.substring(prefix.length))
    }
    return tag[0] === '!' ? tag : `!<${tag}>`
  }

  toString(doc?: Document) {
    const lines =
      !doc || doc.version ? [`%YAML ${this.yaml.version || '1.2'}`] : []
    const tagNames = doc && listTagNames(doc.contents)
    for (const [handle, prefix] of Object.entries(this.tags)) {
      if (handle === '!!' && prefix === 'tag:yaml.org,2002:') continue
      if (!tagNames || tagNames.some(tn => tn.startsWith(prefix)))
        lines.push(`%TAG ${handle} ${prefix}`)
    }
    return lines.join('\n')
  }
}
