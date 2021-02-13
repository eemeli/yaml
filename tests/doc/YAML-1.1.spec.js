import { source } from 'common-tags'
import * as YAML from '../../index.js'

const orig = {}
beforeAll(() => {
  orig.prettyErrors = YAML.defaultOptions.prettyErrors
  orig.version = YAML.defaultOptions.version
  YAML.defaultOptions.prettyErrors = true
  YAML.defaultOptions.version = '1.1'
})
afterAll(() => {
  YAML.defaultOptions.prettyErrors = orig.prettyErrors
  YAML.defaultOptions.version = orig.version
})

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
  const docs = YAML.parseAllDocuments(src, { prettyErrors: false })
  const warn = tag => ({ message: `Unresolved tag: ${tag}` })
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
    '!bar "First document"\n',
    '%TAG ! !foo\n---\n!bar "With directives"\n',
    '%TAG ! !foo\n---\n!bar "Using previous TAG directive"\n',
    '%YAML 1.1\n---\n!bar "Reset settings"\n',
    '%YAML 1.1\n---\n!bar "Using previous YAML directive"\n'
  ])
})
