# YAML Syntax

A YAML _schema_ is a combination of a set of tags and a mechanism for resolving non-specific tags, i.e. values that do not have an explicit tag such as `!!int`.
The [default schema](#data-schemas) is the `'core'` schema, which is the recommended one for YAML 1.2.
For YAML 1.1 documents the default is `'yaml-1.1'`.

## Tags

```js
YAML.parse('"42"')
// '42'

YAML.parse('!!int "42"')
// 42

YAML.parse(`
%TAG ! tag:example.com,2018:app/
---
!foo 42
`)
// YAMLWarning:
//   The tag tag:example.com,2018:app/foo is unavailable,
//   falling back to tag:yaml.org,2002:str
// '42'
```

The default prefix for YAML tags is `tag:yaml.org,2002:`, for which the shorthand `!!` is used when stringified.
Shorthands for other prefixes may also be defined by document-specific directives, e.g. `!e!` or just `!` for `tag:example.com,2018:app/`, but this is not required to use a tag with a different prefix.

During parsing, unresolved tags should not result in errors (though they will be noted as `warnings`), with the tagged value being parsed according to the data type that it would have under automatic tag resolution rules.
This should not result in any data loss, allowing such tags to be handled by the calling app.

In order to have `yaml` provide you with automatic parsing and stringification of non-standard data types, it will need to be configured with a suitable tag object.
For more information, see [Custom Tags](#custom-tags).

The YAML 1.0 tag specification is [slightly different](#changes-from-yaml-1-0-to-1-1) from that used in later versions, and implements prefixing shorthands rather differently.

## Version Differences

This library's parser is based on the 1.2 version of the [YAML spec](http://yaml.org/spec/1.2/spec.html), which is almost completely backwards-compatible with [YAML 1.1](http://yaml.org/spec/1.1/) as well as [YAML 1.0](http://yaml.org/spec/1.0/).
Some specific relaxations have been added for backwards compatibility, but if you encounter an issue please [report it](https://github.com/eemeli/yaml/issues).

### Changes from YAML 1.1 to 1.2

```yaml
%YAML 1.1
---
true: Yes
octal: 014
sexagesimal: 3:25:45
picture: !!binary |
  R0lGODlhDAAMAIQAAP//9/X
  17unp5WZmZgAAAOfn515eXv
  Pz7Y6OjuDg4J+fn5OTk6enp
  56enmleECcgggoBADs=
```

```js
{ true: true,
  octal: 12,
  sexagesimal: 12345,
  picture:
   Buffer [Uint8Array] [
     71, 73, 70, 56, 57, 97, 12, 0, 12, 0, 132, 0, 0,
     255, 255, 247, 245, 245, 238, 233, 233, 229, 102,
     102, 102, 0, 0, 0, 231, 231, 231, 94, 94, 94, 243,
     243, 237, 142, 142, 142, 224, 224, 224, 159, 159,
     159, 147, 147, 147, 167, 167, 167, 158, 158, 158,
     105, 94, 16, 39, 32, 130, 10, 1, 0, 59 ] }
```

The most significant difference between YAML 1.1 and YAML 1.2 is the introduction of the core data schema as the recommended default, replacing the YAML 1.1 type library:

- Only `true` and `false` strings are parsed as booleans (including `True` and `TRUE`); `y`, `yes`, `on`, and their negative counterparts are parsed as strings.
- Underlines `_` cannot be used within numerical values.
- Octal values need a `0o` prefix; e.g. `010` is now parsed with the value 10 rather than 8.
- The binary and sexagesimal integer formats have been dropped.
- The `!!pairs`, `!!omap`, `!!set`, `!!timestamp` and `!!binary` types have been dropped.
- The merge `<<` and value `=` special mapping keys have been removed.

The other major change has been to make sure that YAML 1.2 is a valid superset of JSON. Additionally there are some minor differences between the parsing rules:

- The next-line `\x85`, line-separator `\u2028` and paragraph-separator `\u2029` characters are no longer considered line-break characters. Within scalar values, this means that next-line characters will not be included in the white-space normalisation. Using any of these outside scalar values is likely to result in errors during parsing. For a relatively robust solution, try replacing `\x85` and `\u2028` with `\n` and `\u2029` with `\n\n`.
- Tag shorthands can no longer include any of the characters `,[]{}`, but can include `#`. To work around this, either fix your tag names or use verbatim tags.
- Anchors can no longer include any of the characters `,[]{}`.
- Inside double-quoted strings `\/` is now a valid escape for the `/` character.
- Quoted content can include practically all Unicode characters.
- Documents in streams are now independent of each other, and no longer inherit preceding document directives if they do not define their own.

### Changes from YAML 1.0 to 1.1

```text
%YAML:1.0
---
date: 2001-01-23
number: !int '123'
string: !str 123
pool: !!ball { number: 8 }
invoice: !domain.tld,2002/^invoice
  customers: !seq
    - !^customer
      given : Chris
      family : Dumars
```

The most significant difference between these versions is the complete refactoring of the tag syntax:

- The `%TAG` directive has been added, along with the `!foo!` tag prefix shorthand notation.
- The `^` character no longer enables tag prefixing.
- The private vs. default scoping of `!` and `!!` tag prefixes has been switched around; `!!str` is now a default tag while `!bar` is an application-specific tag.
- Verbatim `!<baz>` tag notation has been added.
- The formal `tag:domain,date/path` format for tag names has been dropped as a requirement.

Additionally, the formal description of the language describing the document structure has been completely refactored between these versions, but the described intent has not changed. Other changes include:

- A `\` escape has been added for the tab character, in addition to the pre-existing `\t`
- The `\^` escape has been removed
- Directives now use a blank space `' '` rather than `:` as the separator between the name and its parameter/value.

`yaml@1` supports parsing and stringifying YAML 1.0 documents, but does not expand tags using the `^` notation.
As there is no indication that _anyone_ is still using YAML 1.0, explicit support has been dropped in `yaml@2`.
