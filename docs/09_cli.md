# Command-line Tool

```sh
npx yaml valid < file.yaml
```

Available as `npx yaml` or `npm exec yaml`:

<pre id="cli-help" style="float: none; clear: none">
yaml: A command-line YAML processor and inspector

Reads stdin and writes output to stdout and errors & warnings to stderr.

Usage:
  yaml          Process a YAML stream, outputting it as YAML
  yaml cst      Parse the CST of a YAML stream
  yaml lex      Parse the lexical tokens of a YAML stream
  yaml valid    Validate a YAML stream, returning 0 on success

Options:
  --help, -h    Show this message.
  --json, -j    Output JSON.
  --indent 2    Output pretty-printed data, indented by the given number of spaces.

Additional options for bare "yaml" command:
  --doc, -d     Output pretty-printed JS Document objects.
  --single, -1  Require the input to consist of a single YAML document.
  --strict, -s  Stop on errors.
  --visit, -v   Apply a visitor to each document (requires a path to import)
  --yaml 1.1    Set the YAML version. (default: 1.2)
</pre>
