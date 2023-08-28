export type LogLevelId = 'silent' | 'error' | 'warn' | 'debug'

export function debug(logLevel: LogLevelId, ...messages: any[]) {
  if (logLevel === 'debug') console.log(...messages)
}

export function warn(logLevel: LogLevelId, warning: string | Error) {
  if (logLevel === 'debug' || logLevel === 'warn') {
    // https://github.com/typescript-eslint/typescript-eslint/issues/7478
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (typeof process !== 'undefined' && process.emitWarning)
      process.emitWarning(warning)
    else console.warn(warning)
  }
}
