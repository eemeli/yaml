import schema from './dist/schema/index.js'
export const findPair = schema.findPair
export const parseMap = schema.parseMap
export const parseSeq = schema.parseSeq

import strNumPkg from './dist/stringify/stringifyNumber.js'
export const stringifyNumber = strNumPkg.stringifyNumber

import strStrPkg from './dist/stringify/stringifyString.js'
export const stringifyString = strStrPkg.stringifyString

import toJsonPkg from './dist/toJSON.js'
export const toJSON = toJsonPkg.toJSON

import constants from './dist/constants.js'
export const Type = constants.Type

import err from './dist/errors.js'
export const YAMLError = err.YAMLError
export const YAMLReferenceError = err.YAMLReferenceError
export const YAMLSemanticError = err.YAMLSemanticError
export const YAMLSyntaxError = err.YAMLSyntaxError
export const YAMLWarning = err.YAMLWarning
