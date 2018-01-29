import { Type } from 'raw-yaml'

import { YAMLSyntaxError } from '../errors'
import Collection, { Pair, toJSON } from './Collection'

export default class Map extends Collection {
  constructor (doc, node) {
    super()
    node.resolved = this
    if (node.type === Type.FLOW_MAP) {
      this.resolveFlowMapItems(doc, node)
    } else {
      this.resolveBlockMapItems(doc, node)
    }
    for (let i = 0; i < this.items.length - 1; ++i) {
      const { key } = this.items[i]
      for (let j = i + 1; j < this.items.length; ++j) {
        if (this.items[j].key === key) {
          doc.errors.push(new YAMLSyntaxError(node, `Map keys must be unique; ${key} is repeated`))
          break
        }
      }
    }
  }

  resolveBlockMapItems (doc, map) {
    let key = undefined
    for (let i = 0; i < map.items.length; ++i) {
      const item = map.items[i]
      switch (item.type) {
        case Type.COMMENT:
          this.addComment(item.comment)
          break
        case Type.MAP_KEY:
          if (key !== undefined) this.items.push(new Pair(key))
          key = doc.resolveNode(item.node)
          break
        case Type.MAP_VALUE:
          this.items.push(new Pair(key, doc.resolveNode(item.node)))
          key = undefined
          break
        default:
          if (key !== undefined) this.items.push(new Pair(key))
          key = doc.resolveNode(item)
      }
    }
    if (key !== undefined) this.items.push(new Pair(key))
  }

  resolveFlowMapItems (doc, map) {
    let key = undefined
    let explicitKey = false
    let next = '{'
    for (let i = 0; i < map.items.length; ++i) {
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
            if (key === undefined) key = null
            explicitKey = false
          }
          if (key !== undefined) {
            this.items.push(new Pair(key))
            key = undefined
          }
        }
        if (item === '}') {
          if (i === map.items.length - 1) continue
        } else if (item === next) {
          next = ':'
          continue
        }
        doc.errors.push(new YAMLSyntaxError(map, `Flow map contains an unexpected ${item}`))
      } else if (item.type === Type.COMMENT) {
        this.addComment(item.comment)
      } else if (key === undefined) {
        if (next === ',') doc.errors.push(new YAMLSyntaxError(item, 'Separator , missing in flow map'))
        key = doc.resolveNode(item)
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
}
