import Node from '../../src/cst/Node'

export const pretty = node => {
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(pretty)
  const res = {}
  if (node.anchor) res.anchor = node.anchor
  if (typeof node.tag === 'string') res.tag = node.tag
  if (node.comment) res.comment = node.comment
  if (node.contents) {
    if (node.directives.length > 0) res.directives = node.directives.map(pretty)
    if (node.contents.length > 0) res.contents = node.contents.map(pretty)
  } else if (node.items) {
    res.type = node.type
    res.items = node.items.map(pretty)
  } else if (typeof node.node !== 'undefined') {
    res.type = node.type
    res.node = pretty(node.node)
  } else if (node.strValue) {
    res.strValue = node.strValue
  } else if (node.rawValue) {
    res.type = node.type
    res.rawValue = node.rawValue
  }
  if (Object.keys(res).every(key => key === 'rawValue')) return res.rawValue
  return res
}

export const testSpec = (res, exp) => {
  if (typeof exp === 'string') {
    const value =
      res instanceof Node
        ? 'strValue' in res
          ? res.strValue
          : res.rawValue
        : typeof res === 'string'
        ? res
        : res && res.char
    expect(value).toBe(exp)
  } else if (Array.isArray(exp)) {
    expect(res).toBeInstanceOf(Array)
    trace: 'test-array', exp
    exp.forEach((e, i) => testSpec(res[i], e))
  } else if (exp) {
    expect(res).toBeInstanceOf(Object)
    trace: 'test-object', exp
    for (const key in exp) testSpec(res[key], exp[key])
  } else {
    expect(res).toBeNull()
  }
}
