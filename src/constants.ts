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

export enum Type {
  BLOCK_FOLDED = 'BLOCK_FOLDED',
  BLOCK_LITERAL = 'BLOCK_LITERAL',
  PLAIN = 'PLAIN',
  QUOTE_DOUBLE = 'QUOTE_DOUBLE',
  QUOTE_SINGLE = 'QUOTE_SINGLE',
}

export const defaultTagPrefix = 'tag:yaml.org,2002:'
