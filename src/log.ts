import { emitWarning } from 'node:process'

export type LogLevelId = 'silent' | 'error' | 'warn' | 'debug'

export function debug(logLevel: LogLevelId, ...messages: any[]) {
  if (logLevel === 'debug') console.log(...messages)
}

export function warn(logLevel: LogLevelId, warning: string | Error) {
  if (logLevel === 'debug' || logLevel === 'warn') {
    if (typeof emitWarning === 'function') emitWarning(warning)
    else console.warn(warning)
  }
}
