export type LogLevelId = 'silent' | 'error' | 'warn' | 'debug'

export function debug(logLevel: LogLevelId, ...messages: any[]) {
  if (logLevel === 'debug') console.log(...messages)
}

export function warn(logLevel: LogLevelId, warning: string | Error) {
  if (logLevel === 'debug' || logLevel === 'warn') {
    if (
      typeof process !== 'undefined' &&
      typeof process.emitWarning === 'function'
    ) {
      process.emitWarning(warning)
    } else {
      console.warn(warning)
    }
  }
}
