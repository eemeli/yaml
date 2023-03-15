import { Document } from './doc/Document.js'
import {
  isAlias,
  isCollection,
  isMap,
  isNode,
  isPair,
  isScalar,
  isSeq
} from './nodes/identity.js'
import type { Node, ParsedNode } from './nodes/Node.js'
import type { Pair } from './nodes/Pair.js'
import { parseAllDocuments } from './public-api.js'
import { visit } from './visit.js'

const scalarChar: Record<string, string> = {
  BLOCK_FOLDED: '>',
  BLOCK_LITERAL: '|',
  PLAIN: ':',
  QUOTE_DOUBLE: '"',
  QUOTE_SINGLE: "'"
}

function anchorExists(doc: Document, anchor: string): boolean {
  let found = false
  visit(doc, {
    Value(_key: unknown, node: Node) {
      if (node.anchor === anchor) {
        found = true
        return visit.BREAK
      }
    }
  })
  return found
}

// test harness for yaml-test-suite event tests
export function testEvents(src: string) {
  const docs = parseAllDocuments(src)
  const errDoc = docs.find(doc => doc.errors.length > 0)
  const error = errDoc ? errDoc.errors[0].message : null
  const events = ['+STR']
  try {
    for (let i = 0; i < docs.length; ++i) {
      const doc = docs[i]
      let root = doc.contents
      if (Array.isArray(root)) root = root[0]
      const [rootStart] = doc.range || [0]
      const error = doc.errors[0]
      if (error && (!error.pos || error.pos[0] < rootStart)) throw new Error()
      let docStart = '+DOC'
      if (doc.directives.docStart) docStart += ' ---'
      else if (
        doc.contents &&
        doc.contents.range[2] === doc.contents.range[0] &&
        !doc.contents.anchor &&
        !doc.contents.tag
      )
        continue
      events.push(docStart)
      addEvents(events, doc, error?.pos[0] ?? -1, root)

      let docEnd = '-DOC'
      if (doc.directives.docEnd) docEnd += ' ...'
      events.push(docEnd)
    }
  } catch (e) {
    return { events, error: error ?? e }
  }
  events.push('-STR')
  return { events, error }
}

function addEvents(
  events: string[],
  doc: Document,
  errPos: number,
  node: ParsedNode | Pair<ParsedNode, ParsedNode | null> | null
) {
  if (!node) {
    events.push('=VAL :')
    return
  }
  if (errPos !== -1 && isNode(node) && node.range[0] >= errPos)
    throw new Error()
  let props = ''
  let anchor = isScalar(node) || isCollection(node) ? node.anchor : undefined
  if (anchor) {
    if (/\d$/.test(anchor)) {
      const alt = anchor.replace(/\d$/, '')
      if (anchorExists(doc, alt)) anchor = alt
    }
    props = ` &${anchor}`
  }
  if (isNode(node) && node.tag) props += ` <${node.tag}>`

  if (isMap(node)) {
    const ev = node.flow ? '+MAP {}' : '+MAP'
    events.push(`${ev}${props}`)
    node.items.forEach(({ key, value }) => {
      addEvents(events, doc, errPos, key)
      addEvents(events, doc, errPos, value)
    })
    events.push('-MAP')
  } else if (isSeq(node)) {
    const ev = node.flow ? '+SEQ []' : '+SEQ'
    events.push(`${ev}${props}`)
    node.items.forEach(item => {
      addEvents(events, doc, errPos, item)
    })
    events.push('-SEQ')
  } else if (isPair(node)) {
    events.push(`+MAP${props}`)
    addEvents(events, doc, errPos, node.key)
    addEvents(events, doc, errPos, node.value)
    events.push('-MAP')
  } else if (isAlias(node)) {
    let alias = node.source
    if (alias && /\d$/.test(alias)) {
      const alt = alias.replace(/\d$/, '')
      if (anchorExists(doc, alt)) alias = alt
    }
    events.push(`=ALI${props} *${alias}`)
  } else {
    const scalar = scalarChar[String(node.type)]
    if (!scalar) throw new Error(`Unexpected node type ${node.type}`)
    const value = node.source
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\x07/g, '\\a')
      .replace(/\x08/g, '\\b')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\v/g, '\\v')
      .replace(/\f/g, '\\f')
      .replace(/\r/g, '\\r')
      .replace(/\x1b/g, '\\e')
    events.push(`=VAL${props} ${scalar}${value}`)
  }
}
