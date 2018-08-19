import fs from 'fs'
import path from 'path'
import Node from '../src/cst/Node'
import { YAMLSemanticError } from '../src/errors'
import YAML from '../src/index'

test('eemeli/yaml#2', () => {
  const src = `
aliases:
  - docker:
      - image: circleci/node:8.11.2
  - key: repository-{{ .Revision }}\n`
  expect(YAML.parse(src)).toMatchObject({
    aliases: [
      { docker: [{ image: 'circleci/node:8.11.2' }] },
      { key: 'repository-{{ .Revision }}' }
    ]
  })
})

test('eemeli/yaml#3', () => {
  const src = '{ ? : 123 }'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toHaveLength(0)
  expect(doc.contents.items[0].key).toBeNull()
  expect(doc.contents.items[0].value.value).toBe(123)
})

test('eemeli/yaml#6', () => {
  const src = 'abc: 123\ndef'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toHaveLength(1)
  expect(doc.errors[0].name).toBe('YAMLSemanticError')
  expect(doc.errors[0].source).toBeInstanceOf(Node)
})

describe('eemeli/yaml#7', () => {
  test('map', () => {
    const src = '{ , }\n---\n{ 123,,, }\n'
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toHaveLength(1)
    expect(docs[1].errors).toHaveLength(2)
  })
  test('seq', () => {
    const src = '[ , ]\n---\n[ 123,,, ]\n'
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toHaveLength(1)
    expect(docs[1].errors).toHaveLength(2)
  })
})

test('eemeli/yaml#8', () => {
  const src = '{'
  const doc = YAML.parseDocument(src)
  expect(doc.errors).toHaveLength(1)
  expect(doc.errors[0].name).toBe('YAMLSemanticError')
})

describe('eemeli/yaml#10', () => {
  test('reported', () => {
    const src = `
aliases:
  - restore_cache:
      - v1-yarn-cache
  - save_cache:
      paths:
        - ~/.cache/yarn
  - &restore_deps_cache
    keys:
      - v1-deps-cache-{{ checksum "yarn.lock" }}\n`
    const docs = YAML.parseAllDocuments(src)
    expect(docs).toHaveLength(1)
    expect(docs[0].errors).toHaveLength(0)
  })

  test('complete file', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, './artifacts/prettier-circleci-config.yml'),
      'utf8'
    )
    const cfg = YAML.parse(src)
    expect(cfg).toMatchObject({
      aliases: [
        { restore_cache: { keys: ['v1-yarn-cache'] } },
        { save_cache: { key: 'v1-yarn-cache', paths: ['~/.cache/yarn'] } },
        {
          restore_cache: { keys: ['v1-deps-cache-{{ checksum "yarn.lock" }}'] }
        },
        {
          save_cache: {
            key: 'v1-yarn-deps-{{ checksum "yarn.lock" }}',
            paths: ['node_modules']
          }
        },
        {
          docker: [{ image: 'circleci/node:9' }],
          working_directory: '~/prettier'
        }
      ],
      jobs: {
        build_prod: {
          '<<': {
            docker: [{ image: 'circleci/node:9' }],
            working_directory: '~/prettier'
          },
          environment: { NODE_ENV: 'production' },
          steps: [
            { attach_workspace: { at: '~/prettier' } },
            { run: 'yarn build' },
            { persist_to_workspace: { paths: ['dist'], root: '.' } },
            { store_artifacts: { path: '~/prettier/dist' } }
          ]
        },
        checkout_code: {
          '<<': {
            docker: [{ image: 'circleci/node:9' }],
            working_directory: '~/prettier'
          },
          steps: [
            'checkout',
            { restore_cache: { keys: ['v1-yarn-cache'] } },
            {
              restore_cache: {
                keys: ['v1-deps-cache-{{ checksum "yarn.lock" }}']
              }
            },
            { run: 'yarn install' },
            { run: 'yarn check-deps' },
            {
              save_cache: {
                key: 'v1-yarn-deps-{{ checksum "yarn.lock" }}',
                paths: ['node_modules']
              }
            },
            { save_cache: { key: 'v1-yarn-cache', paths: ['~/.cache/yarn'] } },
            { persist_to_workspace: { paths: ['.'], root: '.' } }
          ]
        },
        test_prod_node4: {
          '<<': {
            docker: [{ image: 'circleci/node:9' }],
            working_directory: '~/prettier'
          },
          docker: [{ image: 'circleci/node:4' }],
          steps: [
            { attach_workspace: { at: '~/prettier' } },
            { run: 'yarn test:dist' }
          ]
        },
        test_prod_node9: {
          '<<': {
            docker: [{ image: 'circleci/node:9' }],
            working_directory: '~/prettier'
          },
          steps: [
            { attach_workspace: { at: '~/prettier' } },
            { run: 'yarn test:dist' }
          ]
        }
      },
      version: 2,
      workflows: {
        prod: {
          jobs: [
            'checkout_code',
            { build_prod: { requires: ['checkout_code'] } },
            { test_prod_node4: { requires: ['build_prod'] } },
            { test_prod_node9: { requires: ['build_prod'] } }
          ]
        },
        version: 2
      }
    })
  })

  test('minimal', () => {
    const src = `
  - a
  - b:
    - c
  - d`
    const docs = YAML.parseAllDocuments(src)
    expect(docs[0].errors).toHaveLength(0)
    expect(docs[0].toJSON()).toMatchObject(['a', { b: ['c'] }, 'd'])
  })
})

describe('eemeli/yaml#l19', () => {
  test('map', () => {
    const src = 'a:\n  # 123'
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe('a: null # 123\n')
  })
  test('seq', () => {
    const src = '- a: # 123'
    const doc = YAML.parseDocument(src)
    expect(String(doc)).toBe('- a: null # 123\n')
  })
})

test('eemeli/yaml#36', () => {
  expect(() => YAML.parse(`{ x: ${'x'.repeat(1024)} }`)).not.toThrowError()
})
