/* global console, process */

import { LogLevel, LogLevelId } from './constants.js'

export function debug(logLevel: LogLevelId, ...messages: any[]) {
  if (LogLevel.indexOf(logLevel) >= LogLevel.DEBUG) console.log(...messages)
}

export function warn(logLevel: LogLevelId, warning: string | Error) {
  if (LogLevel.indexOf(logLevel) >= LogLevel.WARN) {
    if (typeof process !== 'undefined' && process.emitWarning)
      process.emitWarning(warning)
    else console.warn(warning)
  }
}
