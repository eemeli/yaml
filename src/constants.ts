export type LogLevelId = 'silent' | 'error' | 'warn' | 'debug'

export const LogLevel = Object.assign<
  LogLevelId[],
  { SILENT: 0; ERROR: 1; WARN: 2; DEBUG: 3 }
>(['silent', 'error', 'warn', 'debug'], {
  SILENT: 0,
  ERROR: 1,
  WARN: 2,
  DEBUG: 3
})

export const defaultTagPrefix = 'tag:yaml.org,2002:'
