// https://json-schema.org/draft/2020-12/json-schema-core.html
// https://json-schema.org/draft/2020-12/json-schema-validation.html

type JsonSchema =
  | boolean
  | ArraySchema
  | ObjectSchema
  | NumberSchema
  | StringSchema

type JsonType =
  | 'array'
  | 'object'
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'null'

interface CommonSchema {
  type?: JsonType | JsonType[]
  const?: unknown
  enum?: unknown[]
  format?: string

  // logic/conditionals
  allOf?: JsonSchema[]
  anyOf?: JsonSchema[]
  oneOf?: JsonSchema[]
  not?: JsonSchema
  if?: JsonSchema
  then?: JsonSchema
  else?: JsonSchema

  // references
  $id?: string // uri
  $defs?: Record<string, JsonSchema>
  $anchor?: string // [A-Za-z_][\w.-]*
  $dynamicAnchor?: string
  $ref?: string
  $dynamicRef?: string

  // meta
  $schema?: string // uri
  $vocabulary?: Record<string, boolean> // key is uri
  $comment?: string

  // annotations
  default?: unknown
  deprecated?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  title?: string
  description?: string
  examples?: unknown[]
}

interface ArraySchema extends CommonSchema {
  prefixItems?: JsonSchema[]
  items?: JsonSchema
  contains?: JsonSchema
  unevaluatedItems?: JsonSchema
  maxItems?: number // non-negative integer
  minItems?: number // non-negative integer
  uniqueItems?: boolean
  maxContains?: number // non-negative integer
  minContains?: number // non-negative integer
}

interface ObjectSchema extends CommonSchema {
  properties?: Record<string, JsonSchema>
  patternProperties?: Record<string, JsonSchema> // key is regexp
  additionalProperties?: JsonSchema
  propertyNames?: JsonSchema
  unevaluatedProperties?: JsonSchema
  maxProperties?: number // non-negative integer
  minProperties?: number // non-negative integer
  required?: string[]
  dependentRequired?: Record<string, string[]>
  dependentSchemas?: Record<string, JsonSchema>
}

interface StringSchema extends CommonSchema {
  maxLength?: number // non-negative integer
  minLength?: number // non-negative integer
  patter?: string // regex
  contentEncoding?: string
  contentMediaType?: string
  contentSchema?: JsonSchema
}

interface NumberSchema extends CommonSchema {
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: number
  minimum?: number
  exclusiveMinimum?: number
}
