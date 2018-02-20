import { Type } from '../ast/Node'
import { YAMLSyntaxError } from '../errors'
import Collection, { toJSON } from './Collection'
import Pair from './Pair'
import YAMLSeq from './Seq'

export default class YAMLMap extends Collection {
  constructor (doc, node) {
    super(doc)
    node.resolved = this
    if (node.type === Type.FLOW_MAP) {
      this.resolveFlowMapItems(doc, node)
    } else {
      this.resolveBlockMapItems(doc, node)
    }
    for (let i = 0; i < this.items.length; ++i) {
      const { key } = this.items[i]
      for (let j = i + 1; j < this.items.length; ++j) {
        if (this.items[j].key === key) {
          doc.errors.push(new YAMLSyntaxError(node,
            `Map keys must be unique; "${key}" is repeated`))
          break
        }
      }
      if (doc.options.merge && key === '<<') {
        const src = this.items[i].value
        const srcItems = src instanceof YAMLSeq ? (
          src.items.reduce((acc, { items }) => acc.concat(items), [])
        ) : src.items
        const toAdd = srcItems.reduce((toAdd, pair) => {
          const exists = this.items.some(({ key }) => key === pair.key) || toAdd.some(({ key }) => key === pair.key)
          return exists ? toAdd : toAdd.concat(pair)
        }, [])
        Array.prototype.splice.apply(this.items, [i, 1, ...toAdd])
        i += toAdd.length - 1
      }
    }
  }

  resolveBlockMapItems (doc, map) {
    let key = undefined
    let keyStart = null
    for (let i = 0; i < map.items.length; ++i) {
      const item = map.items[i]
      switch (item.type) {
        case Type.COMMENT:
          this.addComment(item.comment)
          break
        case Type.MAP_KEY:
          if (key !== undefined) this.items.push(new Pair(key))
          key = doc.resolveNode(item.node)
          keyStart = null
          break
        case Type.MAP_VALUE:
          if (key === undefined) key = null
          this.items.push(new Pair(key, doc.resolveNode(item.node)))
          Collection.checkKeyLength(doc, map, i, key, keyStart)
          key = undefined
          keyStart = null
          break
        default:
          if (key !== undefined) this.items.push(new Pair(key))
          key = doc.resolveNode(item)
          keyStart = item.range.start
          if (map.items[i + 1].type !== Type.MAP_VALUE) doc.errors.push(new YAMLSyntaxError(node,
            'Implicit map keys need to be followed by map values'))
      }
    }
    if (key !== undefined) this.items.push(new Pair(key))
  }

  resolveFlowMapItems (doc, map) {
    let key = undefined
    let keyStart = null
    let explicitKey = false
    let next = '{'
    for (let i = 0; i < map.items.length; ++i) {
      Collection.checkKeyLength(doc, map, i, key, keyStart)
      const item = map.items[i]
      if (typeof item === 'string') {
        if (item === '?' && key === undefined && !explicitKey) {
          explicitKey = true
          next = ':'
          continue
        }
        if (item === ':') {
          if (key === undefined) key = null
          if (next === ':') {
            next = ','
            continue
          }
        } else {
          if (explicitKey) {
            if (key === undefined && item !== ',') key = null
            explicitKey = false
          }
          if (key !== undefined) {
            this.items.push(new Pair(key))
            key = undefined
            keyStart = null
          }
        }
        if (item === '}') {
          if (i === map.items.length - 1) continue
        } else if (item === next || (next === ':' && item === ',')) {
          next = ':'
          continue
        }
        doc.errors.push(new YAMLSyntaxError(map, `Flow map contains an unexpected ${item}`))
      } else if (item.type === Type.COMMENT) {
        this.addComment(item.comment)
      } else if (key === undefined) {
        if (next === ',') doc.errors.push(new YAMLSyntaxError(item, 'Separator , missing in flow map'))
        key = doc.resolveNode(item)
        keyStart = explicitKey ? null : item.range.start
        // TODO: add error for non-explicit multiline plain key
      } else {
        if (next !== ',') doc.errors.push(new YAMLSyntaxError(item, 'Indicator : missing in flow map entry'))
        this.items.push(new Pair(key, doc.resolveNode(item)))
        key = undefined
      }
    }
    if (key !== undefined) this.items.push(new Pair(key))
  }

  toJSON () {
    return this.items.reduce((map, { stringKey, value }) => {
      map[stringKey] = toJSON(value)
      return map
    }, {})
  }

  toString (indent, inFlow) {
    const { tags } = this.doc
    const options = { indent, inFlow, type: null }
    const items = this.items.map(pair => pair.toString(tags, options))
    if (inFlow || items.length === 0) {
      // return `{\n  ${indent}${items.join(`,\n  ${indent}`)}\n${indent}}`
      return `{ ${items.join(', ')} }`
    } else {
      return items.join(`\n${indent}`)
    }
  }
}
