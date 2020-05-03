import { YAMLSemanticError, YAMLWarning } from '../errors.js'
import { documentOptions } from '../options.js'

function resolveTagDirective({ tagPrefixes }, directive) {
  const [handle, prefix] = directive.parameters
  if (!handle || !prefix) {
    const msg = 'Insufficient parameters given for %TAG directive'
    throw new YAMLSemanticError(directive, msg)
  }
  if (tagPrefixes.some(p => p.handle === handle)) {
    const msg =
      'The %TAG directive must only be given at most once per handle in the same document.'
    throw new YAMLSemanticError(directive, msg)
  }
  return { handle, prefix }
}

function resolveYamlDirective(doc, directive) {
  let [version] = directive.parameters
  if (directive.name === 'YAML:1.0') version = '1.0'
  if (!version) {
    const msg = 'Insufficient parameters given for %YAML directive'
    throw new YAMLSemanticError(directive, msg)
  }
  if (!documentOptions[version]) {
    const v0 = doc.version || doc.options.version
    const msg = `Document will be parsed as YAML ${v0} rather than YAML ${version}`
    doc.warnings.push(new YAMLWarning(directive, msg))
  }
  return version
}

export function parseDirectives(doc, directives, prevDoc) {
  const directiveComments = []
  let hasDirectives = false
  for (const directive of directives) {
    const { comment, name } = directive
    switch (name) {
      case 'TAG':
        try {
          doc.tagPrefixes.push(resolveTagDirective(doc, directive))
        } catch (error) {
          doc.errors.push(error)
        }
        hasDirectives = true
        break
      case 'YAML':
      case 'YAML:1.0':
        if (doc.version) {
          const msg =
            'The %YAML directive must only be given at most once per document.'
          doc.errors.push(new YAMLSemanticError(directive, msg))
        }
        try {
          doc.version = resolveYamlDirective(doc, directive)
        } catch (error) {
          doc.errors.push(error)
        }
        hasDirectives = true
        break
      default:
        if (name) {
          const msg = `YAML only supports %TAG and %YAML directives, and not %${name}`
          doc.warnings.push(new YAMLWarning(directive, msg))
        }
    }
    if (comment) directiveComments.push(comment)
  }
  if (
    prevDoc &&
    !hasDirectives &&
    '1.1' === (doc.version || prevDoc.version || doc.options.version)
  ) {
    const copyTagPrefix = ({ handle, prefix }) => ({ handle, prefix })
    doc.tagPrefixes = prevDoc.tagPrefixes.map(copyTagPrefix)
    doc.version = prevDoc.version
  }
  doc.commentBefore = directiveComments.join('\n') || null
}
