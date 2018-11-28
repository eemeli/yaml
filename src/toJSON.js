export default function toJSON(value, arg, opt) {
  return Array.isArray(value)
    ? value.map((v, i) => toJSON(v, String(i), opt))
    : value && typeof value.toJSON === 'function'
    ? value.toJSON(arg, opt)
    : value
}
