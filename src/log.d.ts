import type { LogLevelId } from './constants.js'

export function debug(logLevel: LogLevelId, ...messages: any[]): void
export function warn(logLevel: LogLevelId, warning: string | Error): void
