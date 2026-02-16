import { Alias } from '../nodes/Alias.ts'
import { Collection } from '../nodes/Collection.ts'
import { isNode } from '../nodes/identity.ts'
import { type Node } from '../nodes/Node.ts'
import { Pair } from '../nodes/Pair.ts'
import { Scalar } from '../nodes/Scalar.ts'
import type { YAMLMap } from '../nodes/YAMLMap.ts'
import type { CreateNodeOptions } from '../options.ts'
import type { Schema } from '../schema/Schema.ts'
import type { CollectionTag, ScalarTag } from '../schema/types.ts'
import { anchorNames, findNewAnchor } from './anchors.ts'
import { Document, type DocValue, type Replacer } from './Document.ts'

const defaultTagPrefix = 'tag:yaml.org,2002:'

export class NodeCreator {
  keepUndefined: boolean
  replacer?: Replacer
  schema: Schema

  #aliasDuplicateObjects: boolean
  #anchorPrefix: string
  #aliasObjects: unknown[] = []
  #doc?: Document<DocValue, boolean>
  #flow: boolean
  #onTagObj?: (tagObj: ScalarTag | CollectionTag) => void
  #prevAnchors: Set<string> | null = null
  #sourceObjects: Map<unknown, { anchor: string | null; node: Node | null }> =
    new Map()

  constructor(
    doc: Document<DocValue, boolean>,
    options?: CreateNodeOptions,
    replacer?: Replacer
  )
  constructor(
    schema: Schema,
    options: CreateNodeOptions & { aliasDuplicateObjects: false }
  )
  constructor(
    docOrSchema: Document<DocValue, boolean> | Schema,
    options: CreateNodeOptions = {},
    replacer?: Replacer
  ) {
    this.keepUndefined = options.keepUndefined ?? false
    this.replacer = replacer

    this.#flow = options.flow ?? false
    this.#onTagObj = options.onTagObj

    this.#aliasDuplicateObjects = options.aliasDuplicateObjects ?? true
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    this.#anchorPrefix = options.anchorPrefix || 'a'
    if (docOrSchema instanceof Document) {
      this.#doc = docOrSchema
      this.schema = docOrSchema.schema
    } else {
      this.schema = docOrSchema
    }
  }

  create(value: unknown, tagName?: string): Node {
    if (value instanceof Document) value = value.value
    if (isNode(value)) return value
    if (value instanceof Pair) {
      const map = (this.schema.map.nodeClass! as typeof YAMLMap).from(
        this,
        null
      )
      map.items.push(value)
      return map
    }
    if (
      value instanceof String ||
      value instanceof Number ||
      value instanceof Boolean ||
      (typeof BigInt !== 'undefined' && value instanceof BigInt) // not supported everywhere
    ) {
      // https://tc39.es/ecma262/#sec-serializejsonproperty
      value = value.valueOf()
    }

    // Detect duplicate references to the same object & use Alias nodes for all
    // after first. The `ref` wrapper allows for circular references to resolve.
    let ref: { anchor: string | null; node: Node | null } | undefined =
      undefined
    if (this.#aliasDuplicateObjects && value && typeof value === 'object') {
      ref = this.#sourceObjects.get(value)
      if (ref) {
        if (!ref.anchor) {
          this.#aliasObjects.push(value)
          this.#prevAnchors ??= anchorNames(this.#doc!)
          ref.anchor = findNewAnchor(this.#anchorPrefix, this.#prevAnchors)
          this.#prevAnchors.add(ref.anchor)
        }
        return new Alias(ref.anchor)
      } else {
        ref = { anchor: null, node: null }
        this.#sourceObjects.set(value, ref)
      }
    }

    let tagObj: ScalarTag | CollectionTag | undefined
    if (tagName) {
      if (tagName.startsWith('!!'))
        tagName = defaultTagPrefix + tagName.slice(2)
      const match = this.schema.tags.filter(t => t.tag === tagName)
      tagObj = match.find(t => !t.format) ?? match[0]
      if (!tagObj) throw new Error(`Tag ${tagName} not found`)
    } else {
      tagObj = this.schema.tags.find(t => t.identify?.(value) && !t.format)
    }
    if (!tagObj) {
      if (value && typeof (value as any).toJSON === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        value = (value as any).toJSON()
      }
      if (!value || typeof value !== 'object') {
        const node = new Scalar(value)
        if (ref) ref.node = node
        return node
      }
      tagObj =
        value instanceof Map
          ? this.schema.map
          : Symbol.iterator in Object(value)
            ? this.schema.seq
            : this.schema.map
    }
    if (this.#onTagObj) {
      this.#onTagObj(tagObj)
      this.#onTagObj = undefined
    }

    const node =
      tagObj?.createNode?.(this, value) ??
      tagObj?.nodeClass?.from?.(this, value) ??
      new Scalar(value)
    if (tagName) node.tag = tagName
    else if (!tagObj.default) node.tag = tagObj.tag

    if (ref) ref.node = node
    if (this.#flow && node instanceof Collection) node.flow = true
    return node
  }

  createPair(key: unknown, value: unknown): Pair<Node, Node | null> {
    const k = this.create(key)
    const v = value == null ? null : this.create(value)
    return new Pair<Node, Node | null>(k, v)
  }

  /**
   * With circular references, the source node is only resolved after all
   * of its child nodes are. This is why anchors are set only after all of
   * the nodes have been created.
   */
  setAnchors(): void {
    for (const source of this.#aliasObjects) {
      const ref = this.#sourceObjects.get(source)
      if (
        typeof ref === 'object' &&
        ref.anchor &&
        (ref.node instanceof Scalar || ref.node instanceof Collection)
      ) {
        ref.node.anchor = ref.anchor
      } else {
        const msg = 'Failed to resolve repeated object (this should not happen)'
        throw Object.assign(new Error(msg), { source })
      }
    }
  }
}
