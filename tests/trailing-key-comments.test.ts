import { source } from './_utils.ts'
import * as YAML from 'yaml'

describe('trailing key comments in block collections', () => {
  test('kitchen sink', () => {
    const src = source`
      foo: bar
      # test 1
      tutorial: # test 1 level 1
        # test 1 leading comment for array line 1
        # test 1 leading comment for array line 2
        - yaml: # test 1 nesting level 2
            name: value # comment on value
      # Two
      two: # comment on two key
        # comment before keyTwo
        keyTwo: value # comment on keyTwo value
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('test 1 output')
    console.log(output)

    // The key comments should stay inline with their keys
    expect(output).toContain('tutorial: # test 1 level 1')
    expect(output).toContain('yaml: # test 1 nesting level 2')
    expect(output).toContain('two: # comment on two key')

    // Ensure round-trip works
    const reparsed = YAML.parseDocument(output)
    expect(reparsed.toString()).toBe(output)
  })
  test('key comment before block sequence', () => {
    const src = source`
      tutorial: # test 1 level 1
        - yaml: # test 1 nesting level 2
            name: value
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()

    // The key comments should stay inline with their keys
    expect(output).toContain('tutorial: # test 1 level 1')
    expect(output).toContain('yaml: # test 1 nesting level 2')

    // Ensure round-trip works
    const reparsed = YAML.parseDocument(output)
    expect(reparsed.toString()).toBe(output)
  })

  test('key comment before block map', () => {
    const src = source`
      tutorial: #comment
        key: value
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()

    expect(output).toContain('tutorial: #comment')
  })

  test('key comment before block map with comment before key', () => {
    const src = source`
      tutorial: # comment on key
        # comment before key
        key: value
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()

    expect(output).toContain('tutorial: # comment on key')
    // expect(output).toStrictEqual(src)
    expect(String(doc)).toBe(src)
  })

  test('original issue reproduction', () => {
    const originalString = `tutorial: #nesting level 1
  - yaml: #nesting level 2 (2 spaces used for indentation)
      name: YAML Ain't Markup Language #string [literal] #nesting level 3 (4 spaces used for indentation)
      type: awesome #string [literal]
      born: 2001 #number [literal]`

    const originalYamlDoc = YAML.parseDocument(originalString)
    const outputTest = new YAML.Document(originalYamlDoc)
    const outputTestStr = outputTest.toString()

    // Key comments should stay inline
    expect(outputTestStr).toContain('tutorial: #nesting level 1')
    expect(outputTestStr).toContain('yaml: #nesting level 2 (2 spaces used for indentation)')
  })

  test('multiline key comments should still move to separate lines', () => {
    const src = source`
      key: # line 1
           # line 2
        - item
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('multiline key comments output')
    console.log(output)

    // Multiline comments should still be moved to separate lines
    expect(output).not.toContain('key: #line 1')
  })

  test('Handles arrays with comments', () => {
      const src = source`
        key: #comment
          !tag
          - one
          - two
      `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('arrays with comments output')
    console.log(output)
    expect(output).toBe(source`
      key: #comment
        !tag
        - one
        - two
    `)
  })

  test('preserves block scalar comments', () => {
    const src = source`
      yaml: |2
         # Strip
          # Comments:
        strip: |-
          # text
        ␣␣
         # Clip
          # comments:
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('block scalar test output')
    console.log(output)

    // Verify that the "Clip" comments are preserved
    expect(output).toContain('# Clip')
    expect(output).toContain('# comments:')

    // Ensure round-trip works
    const reparsed = YAML.parseDocument(output)
    expect(reparsed.toString()).toBe(output)
  })

  test('array with inline comment on key', () => {
    const src = source`
      items: # array of items
        - first
        - second
        - third
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('array key comment output')
    console.log(output)

    expect(output).toContain('items: # array of items')
    expect(String(doc)).toBe(src)
  })

  test('array items with inline comments', () => {
    const src = source`
      colors:
        - red # primary
        - green # secondary
        - blue # tertiary
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('array items with comments output')
    console.log(output)

    expect(output).toContain('- red # primary')
    expect(output).toContain('- green # secondary')
    expect(output).toContain('- blue # tertiary')
    expect(String(doc)).toBe(src)
  })

  test('nested arrays with comments', () => {
    const src = source`
    matrix: # 2D array
      # row 1
      - - 1 # first element
        - 2 # second element
      # row 2
      - - 3 # first element
        - 4 # second element
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('nested arrays output')
    console.log(output)

    expect(output).toContain('matrix: # 2D array')
    // expect(output).toContain('- # row 1')
    expect(output).toContain('- 1 # first element')
    expect(String(doc)).toBe(src)
  })

  test.skip('nested arrays with comments on -', () => {
    const src = source`
      matrix: # 2D array
        - # row 1
          - 1 # first element
          - 2 # second element
        - # row 2
          - 3 # first element
          - 4 # second element
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('nested arrays output')
    console.log(output)

    expect(output).toContain('matrix: # 2D array')
    expect(output).toContain('- # row 1')
    expect(output).toContain('- 1 # first element')
    expect(String(doc)).toBe(src)
  })

  test('array with leading comments before items', () => {
    const src = source`
      fruits:
        # tropical fruits
        - mango
        - pineapple
        # citrus fruits
        - orange
        - lemon
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('array with leading comments output')
    console.log(output)

    expect(output).toContain('# tropical fruits')
    expect(output).toContain('# citrus fruits')
    expect(String(doc)).toBe(src)
  })

  test('array with mixed comment types', () => {
    const src = source`
      config: # configuration array
        # server settings
        - host: localhost # default host
          port: 8080 # default port
        # client settings
        - timeout: 30 # seconds
          retries: 3 # attempts
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('mixed comment types output')
    console.log(output)

    expect(output).toContain('config: # configuration array')
    expect(output).toContain('# server settings')
    expect(output).toContain('host: localhost # default host')
    expect(String(doc)).toBe(src)
  })

  test('flow array with comments', () => {
    const src = source`
    simple: [one, two, three] # simple array
    with_comments: [a, b, c] # array with comments
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('flow array output')
    console.log(output)

    expect(output).toContain('simple: [ one, two, three ] # simple array')
    expect(output).toContain('with_comments: [ a, b, c ] # array with comments')
    expect(String(doc)).toBe( source`
    simple: [ one, two, three ] # simple array
    with_comments: [ a, b, c ] # array with comments
    `)
  })

  test('array with tagged items and comments', () => {
    const src = source`
      tagged: # tagged array
        - !str hello # string tag
        - !!int 42 # integer tag
        - !!float 3.14 # float tag
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('tagged array output')
    console.log(output)

    expect(output).toContain('tagged: # tagged array')
    expect(output).toContain('- !str hello # string tag')
    expect(output).toContain('- !!int 42 # integer tag')
    expect(output).toContain('- !!float 3.14 # float tag')
    expect(String(doc)).toBe(src)
  })

  test('array with anchor and alias comments', () => {
    const src = source`
      anchors: # anchor definitions
        # base anchor
        - &base
          name: base
          value: 1
        - *base # alias reference
        # derived anchor
        - &derived
          <<: *base # merge key
          value: 2 # override
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('anchor alias output')
    console.log(output)

    expect(output).toContain('anchors: # anchor definitions')
    expect(output).toContain('- *base # alias reference')
    expect(String(doc)).toBe(src)
  })

  // TODO: This is not working as expected. # derived anchor is hoisted
  test.skip('array with anchor and alias comments - inline', () => {
    const src = source`
      anchors: # anchor definitions
        - &base # base anchor
          name: base
          value: 1
        - *base # alias reference
        - &derived # derived anchor
          <<: *base # merge key
          value: 2 # override
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('anchor alias output')
    console.log(output)

    expect(output).toContain('anchors: # anchor definitions')
    expect(output).toContain('- &base # base anchor')
    expect(output).toContain('- *base # alias reference')
    expect(String(doc)).toBe(src)
  })

  test('array with scalar comments and block scalars', () => {
    const src = source`
      mixed: # mixed content array
        - plain # plain scalar
        - | # literal block
          block
          content
        - > # folded block
          folded content
        - quoted # quoted scalar
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('mixed scalar types output')
    console.log(output)

    expect(output).toContain('mixed: # mixed content array')
    expect(output).toContain('- plain # plain scalar')
    expect(output).toContain('- | # literal block')
    expect(output).toContain('- > # folded block')
    expect(String(doc)).toBe(src)
  })

  // TODO: This is not working as expected. `- # empty item 1` has 2 spaces `-  # empty item 1`
  test.skip('array with empty items and comments', () => {
    const src = source`
      empty: # array with empty items
        - # empty item 1
        - # empty item 2
        - value # non-empty item
        - # empty item 3
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('empty array items output')
    console.log(output)

    expect(output).toContain('empty: # array with empty items')
    expect(output).toContain('- # empty item 1')
    expect(output).toContain('- value # non-empty item')
    expect(String(doc)).toBe(src)
  })

  test('array with multiline comments', () => {
    const src = source`
      multiline: # array with
        # multiline comments
        - item1 # first item
        - item2 # second item
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('multiline comments output')
    console.log(output)

    expect(output).toContain('multiline: # array with')
    expect(output).toContain('# multiline comments')
    expect(output).toContain('- item1 # first item')
    expect(String(doc)).toBe(src)
  })

  // Indentation is not preserved
  test.skip('array with multiline comments with indentation', () => {
    const src = source`
      multiline: # array with
                 # multiline comments
        - item1 # first item
        - item2 # second item
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('multiline comments output')
    console.log(output)

    expect(output).toContain('multiline: # array with')
    expect(output).toContain('# multiline comments')
    expect(output).toContain('- item1 # first item')
    expect(String(doc)).toBe(src)
  })

  test('array with complex nested structure and comments', () => {
    const src = source`
      complex: # complex nested structure
        - name: outer # outer object
          items: # inner array
            - inner1 # inner item 1
            - inner2 # inner item 2
          config: # nested object
            enabled: true # flag
            count: 5 # number
        - simple: value # simple item
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('complex nested structure output')
    console.log(output)

    expect(output).toContain('complex: # complex nested structure')
    expect(output).toContain('- name: outer # outer object')
    expect(output).toContain('items: # inner array')
    expect(output).toContain('- inner1 # inner item 1')
    expect(output).toContain('config: # nested object')
    expect(output).toContain('enabled: true # flag')
    expect(String(doc)).toBe(src)
  })

  test.skip('array with directive and document comments', () => {
    const src = source`
      %YAML 1.2 # YAML version
      --- # document start
      array: # main array
        - item1 # first item
        - item2 # second item
      ... # document end
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('directive comments output')
    console.log(output)

    expect(output).toContain('%YAML 1.2 # YAML version')
    expect(output).toContain('--- # document start')
    expect(output).toContain('array: # main array')
    expect(output).toContain('... # document end')
    expect(String(doc)).toBe(src)
  })

  test('array with special characters in comments', () => {
    const src = source`
      special: # array with special chars
        - normal # normal comment
        - quoted # "quoted" comment
        - escaped # \\n escaped \\t chars
        - unicode # 🚀 emoji comment
        - symbols # @#$%^&* symbols
    `
    const doc = YAML.parseDocument(src)
    console.log('Document errors:', doc.errors)
    console.log('Document warnings:', doc.warnings)

    if (doc.errors.length > 0) {
      console.log('First error:', doc.errors[0])
    }

    const output = doc.toString()
    console.log('special characters output')
    console.log(output)

    expect(output).toContain('special: # array with special chars')
    expect(output).toContain('- normal # normal comment')
    expect(output).toContain('- quoted # "quoted" comment')
    expect(output).toContain('- unicode # 🚀 emoji comment')
    expect(String(doc)).toBe(src)
  })

  test('key with big 3-line comment', () => {
    const src = source`
      important_config:
        # This is a very important configuration
        # that controls the core behavior of the system
        # and should be handled with extreme care
        setting1: value1
        # This is a very important configuration
        # that controls the core behavior of the system
        # and should be handled with extreme care
        setting2: value2
    `
    const doc = YAML.parseDocument(src)
    const output = doc.toString()
    console.log('big 3-line comment output')
    console.log(output)

    expect(String(doc)).toBe(src)
  })


  test('Test manipulation of comments', () => {
    // Test programmatic comment manipulation
    const src = source`
      key1: value1
      key2: value2
      array:
        - item1
        - item2
    `
    const doc = YAML.parseDocument(src)

    // Add comments to existing nodes
    const key1 = doc.contents.items[0]
    key1.key.comment = ' key comment'
    key1.value.comment = ' value comment'

    const key2 = doc.contents.items[1]
    key2.value.commentBefore = ' comment before value'
    // key2.value.spaceBefore = true

    const arrayNode = doc.contents.items[2]
    arrayNode.key.comment = ' array comment'
    arrayNode.value.items[0].comment = ' first item comment'
    arrayNode.value.comment = ' end of array comment'

    // Document-level comments
    doc.commentBefore = ' Document comment'
    doc.comment = ' End document comment'

    const output = doc.toString()
    console.log('comment manipulation output')
    console.log(output)

    // Verify the exact expected output format
    const expectedOutput = source`
      # Document comment

      key1: # key comment
        value1 # value comment
      key2:
        # comment before value
        value2
      array: # array comment
        - item1 # first item comment
        - item2
        # end of array comment

      # End document comment
    `
    expect(output).toBe(expectedOutput)
  })

  test('Test comment removal and modification', () => {
    const src = source`
      # Original comment
      key: value # inline comment
      # Another comment
      array:
        - item # item comment
    `
    const doc = YAML.parseDocument(src)

    // Remove the original comment (attached to the first key)
    const keyPair = doc.contents.items[0]
    keyPair.key.commentBefore = null

    // Modify inline comment
    keyPair.value.comment = ' modified comment'

    // Remove array comment and add new one
    const arrayPair = doc.contents.items[1]
    arrayPair.key.commentBefore = null  // This removes "Another comment"
    arrayPair.key.comment = ' new array comment'

    // Modify item comment
    arrayPair.value.items[0].comment = ' modified item comment'

    const output = doc.toString()
    console.log('comment modification output')
    console.log(output)

    // Verify modifications
    expect(output).not.toContain('# Original comment')
    expect(output).toContain('key: value # modified comment')
    expect(output).not.toContain('# Another comment')
    expect(output).toContain('array: # new array comment')
    expect(output).toContain('- item # modified item comment')
  })

  test('Test adding comments to programmatically created nodes', () => {
    // Create a new document from scratch
    const doc = new YAML.Document()

    // Create a map
    const map = doc.createNode({
      name: 'test',
      version: '1.0',
      features: ['parsing', 'stringifying']
    })

    doc.contents = map

    // Add comments to the programmatically created nodes
    map.items[0].key.comment = ' project name'
    map.items[0].value.commentBefore = ' semantic version'
    map.items[0].value.spaceBefore = true

    map.items[1].key.comment = ' version number'
    map.items[1].value.comment = ' follows semver'

    map.items[2].key.comment = ' available features'
    map.items[2].value.items[0].comment = ' read YAML'
    map.items[2].value.items[1].comment = ' write YAML'
    map.items[2].value.comment = ' core functionality'

    // Document-level comments
    doc.commentBefore = ' Generated configuration'
    doc.comment = ' End of config'

    const output = doc.toString()
    console.log('programmatic creation output')
    console.log(output)

    // Verify all programmatically added comments
    expect(output).toContain('# Generated configuration')
    expect(output).toContain('name: # project name')
    expect(output).toContain('# semantic version')
    expect(output).toContain('version: # version number')
    expect(output).toContain('"1.0" # follows semver')
    expect(output).toContain('features: # available features')
    expect(output).toContain('- parsing # read YAML')
    expect(output).toContain('- stringifying # write YAML')
    expect(output).toContain('# core functionality')
    expect(output).toContain('# End of config')
  })

  test('Test comment inheritance and round-trip', () => {
    const src = source`
      # Top level comment
      config:
        # Database settings
        database:
          host: localhost # server address
          port: 5432 # default postgres port
        # Cache settings
        cache:
          enabled: true # feature flag
          ttl: 300 # seconds
    `

    const doc = YAML.parseDocument(src)
    const configNode = doc.contents.items[0]

    // Add additional comments
    configNode.value.items[0].value.items[1].value.comment = ' updated port comment'
    configNode.value.items[1].value.items[1].value.commentBefore = ' time to live'
    configNode.value.items[1].value.items[1].value.spaceBefore = true

    const output = doc.toString()
    console.log('inheritance and round-trip output')
    console.log(output)

    // Parse the output again to test round-trip
    const reparsed = YAML.parseDocument(output)
    const roundTripOutput = reparsed.toString()

    // Verify original and added comments are preserved
    expect(output).toContain('# Top level comment')
    expect(output).toContain('# Database settings')
    expect(output).toContain('port: 5432 # updated port comment')
    expect(output).toContain('# time to live')
    expect(output).toContain('# Cache settings')

    // Verify round-trip stability
    expect(roundTripOutput).toBe(output)
  })

})