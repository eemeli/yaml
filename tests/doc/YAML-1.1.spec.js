import YAML from '../../src/index'
import { source } from 'common-tags'

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
  const docs = YAML.parseAllDocuments(src, { prettyErrors: true })
  expect(docs).toHaveLength(5)
  expect(docs.map(doc => doc.errors)).toMatchObject([[], [], [], [], []])
  const warn = tag => ({
    message: `The tag ${tag} is unavailable, falling back to tag:yaml.org,2002:str`
  })
  expect(docs.map(doc => doc.warnings)).toMatchObject([
    [warn('!bar')],
    [warn('!foobar')],
    [warn('!foobar')],
    [warn('!bar')],
    [warn('!bar')]
  ])
  expect(docs.map(doc => doc.version)).toMatchObject([
    null,
    null,
    null,
    '1.1',
    '1.1'
  ])
  expect(docs.map(String)).toMatchObject([
    '!bar "First document"\n',
    '%TAG ! !foo\n---\n!bar "With directives"\n',
    '%TAG ! !foo\n---\n!bar "Using previous TAG directive"\n',
    '%YAML 1.1\n---\n!bar "Reset settings"\n',
    '%YAML 1.1\n---\n!bar "Using previous YAML directive"\n'
  ])
})
