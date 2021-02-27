import { Document } from './doc/Document.js'
import { isNode, ParsedNode } from './nodes/Node.js'
import { Pair } from './nodes/Pair.js'
import { Scalar } from './nodes/Scalar.js'
import type { Options } from './options.js'
import { parseAllDocuments } from './public-api.js'

// test harness for yaml-test-suite event tests
export function testEvents(src: string, options?: Options) {
  const opt = Object.assign({ keepNodeTypes: true, version: '1.2' }, options)
  const docs = parseAllDocuments(src, opt)
  const errDoc = docs.find(doc => doc.errors.length > 0)
  const error = errDoc ? errDoc.errors[0].message : null
  const events = ['+STR']
  try {
    for (let i = 0; i < docs.length; ++i) {
      const doc = docs[i]
      let root = doc.contents
      if (Array.isArray(root)) root = root[0]
      const [rootStart, rootEnd] = doc.range || [0, 0]
      const error = doc.errors[0]
      if (error && (!error.offset || error.offset < rootStart))
        throw new Error()
      let docStart = '+DOC'
      if (doc.directivesEndMarker) docStart += ' ---'
      else if (doc.contents && doc.contents.range[1] === doc.contents.range[0])
        continue
      events.push(docStart)
      addEvents(events, doc, error?.offset ?? -1, root)

      let docEnd = '-DOC'
      if (rootEnd) {
        const post = src.slice(rootStart, rootEnd)
        if (/^\.\.\.($|\s)/m.test(post)) docEnd += ' ...'
      }
      events.push(docEnd)
    }
  } catch (e) {
    return { events, error: error || e }
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
  let anchor = isNode(node) ? doc.anchors.getName(node) : undefined
  if (anchor) {
    if (/\d$/.test(anchor)) {
      const alt = anchor.replace(/\d$/, '')
      if (doc.anchors.getNode(alt)) anchor = alt
    }
    props = ` &${anchor}`
  }
  if (node.tag) props += ` <${node.tag}>`
  let scalar = null
  switch (node.type) {
    case 'ALIAS':
      {
        let alias = doc.anchors.getName(node.source)
        if (alias && /\d$/.test(alias)) {
          const alt = alias.replace(/\d$/, '')
          if (doc.anchors.getNode(alt)) alias = alt
        }
        events.push(`=ALI${props} *${alias}`)
      }
      break
    case 'BLOCK_FOLDED':
      scalar = '>'
      break
    case 'BLOCK_LITERAL':
      scalar = '|'
      break
    case 'PLAIN':
      scalar = ':'
      break
    case 'QUOTE_DOUBLE':
      scalar = '"'
      break
    case 'QUOTE_SINGLE':
      scalar = "'"
      break
    case 'PAIR':
      events.push(`+MAP${props}`)
      addEvents(events, doc, errPos, node.key)
      addEvents(events, doc, errPos, node.value)
      events.push('-MAP')
      break
    case 'FLOW_SEQ':
    case 'SEQ':
      events.push(`+SEQ${props}`)
      node.items.forEach(item => {
        addEvents(events, doc, errPos, item)
      })
      events.push('-SEQ')
      break
    case 'FLOW_MAP':
    case 'MAP':
      events.push(`+MAP${props}`)
      node.items.forEach(({ key, value }) => {
        addEvents(events, doc, errPos, key)
        addEvents(events, doc, errPos, value)
      })
      events.push('-MAP')
      break
    default:
      throw new Error(`Unexpected node type ${node.type}`)
  }
  if (scalar) {
    const value = (node as Scalar.Parsed).source
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
