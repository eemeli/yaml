#!/usr/bin/env node

import { UserError, cli, help } from './cli.ts'

await cli(process.stdin, error => {
  if (error instanceof UserError) {
    if (error.code === UserError.ARGS) console.error(`${help}\n`)
    console.error(error.message)
    process.exitCode = error.code
  } else if (error) throw error
})
