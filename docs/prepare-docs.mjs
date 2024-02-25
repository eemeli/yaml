#!/usr/bin/env node

import {
  lstat,
  mkdir,
  readdir,
  readFile,
  symlink,
  rm,
  writeFile
} from 'node:fs/promises'
import { resolve } from 'node:path'
import { help } from '../dist/cli.mjs'
import { parseAllDocuments } from '../dist/index.js'

const source = 'docs'
const target = 'docs-slate/source'

// Update CLI help
const cli = resolve(source, '09_cli.md')
const docs = await readFile(cli, 'utf-8')
const update = docs.replace(
  /(<pre id="cli-help".*?>).*?(<\/pre>)/s,
  '$1\n' + help + '\n$2'
)
if (update !== docs) await writeFile(cli, update)

// Create symlink for index.html.md
const indexSource = resolve(source, 'index.html.md')
const indexTarget = resolve(target, 'index.html.md')
try {
  const prevIndex = await lstat(indexTarget)
  if (prevIndex.isSymbolicLink()) await rm(indexTarget)
} catch {}
await symlink(indexSource, indexTarget, 'file')

// Create symlinks for included sections
const includesDir = resolve(target, 'includes')
try {
  await mkdir(includesDir)
} catch {
  for (const ent of await readdir(includesDir, { withFileTypes: true })) {
    if (ent.isSymbolicLink()) await rm(resolve(includesDir, ent.name))
  }
}
const [indexDoc] = parseAllDocuments(await readFile(indexSource, 'utf-8'))
for (const { value } of indexDoc.get('includes').items) {
  const name = `${value}.md`
  await symlink(resolve(source, name), resolve(includesDir, name), 'file')
}
