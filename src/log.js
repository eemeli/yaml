/* global console, process */

import { LogLevel } from './constants.js'

export function debug(logLevel, ...messages) {
  if (LogLevel.indexOf(logLevel) >= LogLevel.DEBUG)
    console.log.apply(console, messages)
}

export function warn(logLevel, warning) {
  if (LogLevel.indexOf(logLevel) >= LogLevel.WARN) {
    if (typeof process !== 'undefined' && process.emitWarning)
      process.emitWarning(warning)
    else console.warn(warning)
  }
}
