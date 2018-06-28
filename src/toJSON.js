export default function toJSON(value) {
  return Array.isArray(value)
    ? value.map(toJSON)
    : value && typeof value === 'object' && 'toJSON' in value
      ? value.toJSON()
      : value
}
