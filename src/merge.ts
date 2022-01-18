import {
  isCollection,
  isDocument,
  isMap,
  isScalar,
  isSeq,
  isNode,
  Node
} from './nodes/Node'
import { Document } from './doc/Document'
import { Pair } from './nodes/Pair'
import { visit } from './visit'
import { Scalar } from './nodes/Scalar'
import { Collection } from './nodes/Collection'
import { YAMLMap } from './nodes/YAMLMap'
import { YAMLSeq } from './nodes/YAMLSeq'
import { MergeOptions } from './options'

function getPath(ancestry: readonly (Document | Node | Pair)[]): (string|number)[] {
  return ancestry.reduce<(string|number)[]>((p, { key }: any) => {
    return (key !== undefined) ? [...p, key.value] : p;
  }, []);
}

function getFirstChildNode(collection: Collection): Node | undefined {
  if (collection.constructor.name === 'YAMLSeq') {
    return <Node | undefined>(<YAMLSeq> collection).items.find(
      (i) => isNode(i)
    );
  }
  if (collection.constructor.name === 'YAMLMap') {
    const firstChildKey = (<YAMLMap> collection).items[0]?.key;
    if (!firstChildKey) {
      return undefined;
    }
    if (isScalar(firstChildKey)) {
      return firstChildKey;
    }
    return new Scalar(firstChildKey);
  }
  const type = collection.constructor?.name || typeof collection;
  throw Error(`Cannot identify a child Node for type ${type}`);
}

function moveMetaPropsToFirstChildNode(collection: Collection): void {
  const firstChildNode = getFirstChildNode(collection)

  const {comment, commentBefore, spaceBefore} = collection;

  if (!(comment || commentBefore || spaceBefore)) return;

  if (!firstChildNode) throw new Error(
    'Cannot move meta properties to a child of an empty Collection'
  )

  Object.assign(firstChildNode, { comment, commentBefore, spaceBefore })

  delete collection.commentBefore
  delete collection.comment
  delete collection.spaceBefore
}

/** Merge another collection into this */
export function merge(target: Document, source: unknown, options: MergeOptions = {}): Document {
  const opt = Object.assign(
    {
      onSequence: 'replace',
    },
    options
  )

  const sourceNode = target.createNode(isDocument(source) ? source.contents : source)

  if (!isCollection(sourceNode)) {
    const type = (<any> source).constructor?.name || typeof source;
    throw new Error(`Cannot merge type "${type}", expected a Collection`)
  }

  if (!isCollection(target.contents)) {
    // If the target doc is empty add the source to it directly
    target.add(source)
    return target
  }

  visit(sourceNode, {
    Map: (_, node, ancestors) => {
      const path = getPath(ancestors);
      moveMetaPropsToFirstChildNode(node)
      // In case both the source and the target node have comments or spaces
      // We'll move them to their first child so they do not conflict
      if(target.hasIn(path)) {
        const targetNode = target.getIn(path, true)

        if (!isMap(targetNode)) {
          const type = (<any> targetNode).constructor?.name || typeof targetNode;
          throw new Error(`Conflict at "${path.join('.')}": Destination node is of type ${type}, the node to be merged is of type ${node.constructor.name}`)
        }

        moveMetaPropsToFirstChildNode(targetNode)
      }
    },
    Pair: (_, node, ancestors) => {
      if (isScalar(node.value)) {
        const path = getPath(ancestors);
        if (target.hasIn([...path, (<Scalar> node.key).value])) {
          target.setIn(path, node);
        } else {
          target.addIn(path, node);
        }
        return visit.SKIP;
      }
    },
    Seq: (_, node, ancestors) => {
      const path = getPath(ancestors);
      moveMetaPropsToFirstChildNode(node)
      if(target.hasIn(path)) {
        const targetNode = target.getIn(path, true)
        if (!isSeq(targetNode)) {
          const type = (<any> targetNode).constructor?.name || typeof targetNode;
          throw new Error(`Conflict at "${path.join('.')}": Destination node is of type ${type}, the node to be merged is of type ${node.constructor.name}`)
        }
        moveMetaPropsToFirstChildNode(targetNode)
      }
      if (opt.onSequence === 'replace') {
        target.setIn(path, node)
        return visit.SKIP;
      }
      for (const item of node.items) target.addIn(path, item)
      return visit.SKIP;
    },
  });
 return target
}