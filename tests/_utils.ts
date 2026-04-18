/** Trim leading whitespace from each line */
export function source(
  strings: TemplateStringsArray,
  ...expressions: unknown[]
): string {
  // concatenate
  let res = strings[0]
  for (let i = 1; i < strings.length; ++i)
    res += String(expressions[i]) + strings[i + 1]

  // remove trailing whitespace + initial newline
  res = res.replace(/[^\S\n]+$/gm, '').replace(/^\n/, '')

  // remove the shortest leading indentation from each line
  const match = res.match(/^[^\S\n]*(?=\S)/gm)
  const indent = match && Math.min(...match.map(el => el.length))
  return indent ? res.replace(new RegExp(`^.{${indent}}`, 'gm'), '') : res
}

/** Test shorthand for `expect(YAMLMap).toMatchObject()` */
export function _map(
  input: Record<string, any> | [any, any][],
  props?: Record<string, any>
): Record<string, any> {
  const entries = Array.isArray(input) ? input : Object.entries(input)
  const values = new Map(entries.map(([k, v]) => [k, _pair(k, v)]))
  return { values, ...props }
}

/** Test shorthand for `expect(Pair).toMatchObject()` */
export function _pair(key: any, value: any): { key: any; value: any } {
  return value &&
    typeof value === 'object' &&
    'key' in value &&
    'value' in value
    ? value
    : { key: _node(key), value: _node(value) }
}

/** Test shorthand for `expect(YAMLSeq).toMatchObject()` */
export function _seq(...inputs: any[]): any[] {
  return inputs.map(_node)
}

/** Test shorthand for `expect(YAMLSet).toMatchObject()` */
export function _set(
  input: (boolean | number | string | null | [any, any])[],
  props?: Record<string, any>
): Record<string, any> {
  const values = new Map(
    input.map(e => (Array.isArray(e) ? [e[0], _node(e[1])] : [e, _node(e)]))
  )
  return { values, ...props }
}

function _node(value: unknown) {
  switch (typeof value) {
    case 'bigint':
    case 'boolean':
    case 'number':
    case 'string':
      return { value }
    default:
      return value
  }
}
