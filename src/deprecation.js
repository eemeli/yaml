/* global global, console */
export function warnFileDeprecation(filename) {
  if (global && global._YAML_SILENCE_DEPRECATION_WARNINGS) return
  const path = filename
    .replace(/.*yaml[/\\]/i, '')
    .replace(/\.js$/, '')
    .replace(/\\/g, '/')
  const msg = `The endpoint 'yaml/${path}' will be removed in a future release.`
  if (global && global.process && global.process.emitWarning) {
    global.process.emitWarning(msg, 'DeprecationWarning')
  } else {
    // eslint-disable-next-line no-console
    console.warn(`DeprecationWarning: ${msg}`)
  }
}
