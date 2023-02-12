import { source } from '../_utils'
import { parseAllDocuments } from 'yaml'

test('Use preceding directives if none defined', () => {
  const src = source`
    !bar "First document"
    ...
    %TAG ! !foo
    ---
    !bar "With directives"
    ---
    !bar "Using previous TAG directive"
    ...
    %YAML 1.1
    ---
    !bar "Reset settings"
    ---
    !bar "Using previous YAML directive"
  `
  const docs = parseAllDocuments(src, { prettyErrors: false, version: '1.1' })
  const warn = (tag: string) => ({ message: `Unresolved tag: ${tag}` })
  expect(docs).toMatchObject([
    {
      directives: { yaml: { version: '1.1', explicit: false } },
      errors: [],
      warnings: [warn('!bar')]
    },
    {
      directives: { yaml: { version: '1.1', explicit: false } },
      errors: [],
      warnings: [warn('!foobar')]
    },
    {
      directives: { yaml: { version: '1.1', explicit: false } },
      errors: [],
      warnings: [warn('!foobar')]
    },
    {
      directives: { yaml: { version: '1.1', explicit: true } },
      errors: [],
      warnings: [warn('!bar')]
    },
    {
      directives: { yaml: { version: '1.1', explicit: true } },
      errors: [],
      warnings: [warn('!bar')]
    }
  ])
  expect(docs.map(String)).toMatchObject([
    '!bar "First document"\n...\n',
    '%TAG ! !foo\n---\n!bar "With directives"\n',
    '%TAG ! !foo\n---\n!bar "Using previous TAG directive"\n...\n',
    '%YAML 1.1\n---\n!bar "Reset settings"\n',
    '%YAML 1.1\n---\n!bar "Using previous YAML directive"\n'
  ])
})
