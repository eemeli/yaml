#!/usr/bin/env node

/* global console, process */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable no-restricted-imports */

import { UserError, cli, help } from './dist/cli.js'

cli(process.stdin, error => {
  if (error instanceof UserError) {
    if (error.code === UserError.ARGS) console.error(`${help}\n`)
    console.error(error.message)
    process.exitCode = error.code
  } else if (error) throw error
})
