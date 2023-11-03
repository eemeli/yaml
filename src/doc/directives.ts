import { isNode } from '../nodes/identity.js'
import { visit } from '../visit.js'
import type { Document } from './Document.js'

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

export class Directives {
  static defaultYaml: Directives['yaml'] = { explicit: false, version: '1.2' }
  static defaultTags: Directives['tags'] = { '!!': 'tag:yaml.org,2002:' }

  yaml: { version: '1.1' | '1.2' | 'next'; explicit?: boolean }
  tags: Record<string, string>

  /**
   * The directives-end/doc-start marker `---`. If `null`, a marker may still be
   * included in the document's stringified representation.
   */
  docStart: true | null = null

  /** The doc-end marker `...`.  */
  docEnd = false

  /**
   * Used when parsing YAML 1.1, where:
   * > If the document specifies no directives, it is parsed using the same
   * > settings as the previous document. If the document does specify any
   * > directives, all directives of previous documents, if any, are ignored.
   */
  private atNextDocument?: boolean

  constructor(yaml?: Directives['yaml'], tags?: Directives['tags']) {
    this.yaml = Object.assign({}, Directives.defaultYaml, yaml)
    this.tags = Object.assign({}, Directives.defaultTags, tags)
  }

  clone(): Directives {
    const copy = new Directives(this.yaml, this.tags)
    copy.docStart = this.docStart
    return copy
  }

  /**
   * During parsing, get a Directives instance for the current document and
   * update the stream state according to the current version's spec.
   */
  atDocument() {
    const res = new Directives(this.yaml, this.tags)
    switch (this.yaml.version) {
      case '1.1':
        this.atNextDocument = true
        break
      case '1.2':
        this.atNextDocument = false
        this.yaml = {
          explicit: Directives.defaultYaml.explicit,
          version: '1.2'
        }
        this.tags = Object.assign({}, Directives.defaultTags)
        break
    }
    return res
  }

  /**
   * @param onError - May be called even if the action was successful
   * @returns `true` on success
   */
  add(
    line: string,
    onError: (offset: number, message: string, warning?: boolean) => void
  ) {
    if (this.atNextDocument) {
      this.yaml = { explicit: Directives.defaultYaml.explicit, version: '1.1' }
      this.tags = Object.assign({}, Directives.defaultTags)
      this.atNextDocument = false
    }
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
        this.yaml.explicit = true
        if (parts.length !== 1) {
          onError(0, '%YAML directive should contain exactly one part')
          return false
        }
        const [version] = parts
        if (version === '1.1' || version === '1.2') {
          this.yaml.version = version
          return true
        } else {
          const isValid = /^\d+\.\d+$/.test(version)
          onError(6, `Unsupported YAML version ${version}`, isValid)
          return false
        }
      }
      default:
        onError(0, `Unknown directive ${name}`, true)
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

    const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s) as string[]
    if (!suffix) onError(`The ${source} tag has no suffix`)
    const prefix = this.tags[handle]
    if (prefix) {
      try {
        return prefix + decodeURIComponent(suffix)
      } catch (error) {
        onError(String(error))
        return null
      }
    }
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
    const lines = this.yaml.explicit
      ? [`%YAML ${this.yaml.version || '1.2'}`]
      : []

    const tagEntries = Object.entries(this.tags)

    let tagNames: string[]
    if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
      const tags: Record<string, boolean> = {}
      visit(doc.contents, (_key, node) => {
        if (isNode(node) && node.tag) tags[node.tag] = true
      })
      tagNames = Object.keys(tags)
    } else tagNames = []

    for (const [handle, prefix] of tagEntries) {
      if (handle === '!!' && prefix === 'tag:yaml.org,2002:') continue
      if (!doc || tagNames.some(tn => tn.startsWith(prefix)))
        lines.push(`%TAG ${handle} ${prefix}`)
    }
    return lines.join('\n')
  }
}
