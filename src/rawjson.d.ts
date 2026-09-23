// https://github.com/microsoft/TypeScript/issues/61330

interface JSON {
  isRawJSON(value: unknown): value is RawJSON
  parse(
    text: string,
    reviver: (
      this: any,
      key: string,
      value: any,
      context: { source?: string }
    ) => any
  ): any
  rawJSON(text: string): RawJSON
}

interface RawJSON {
  readonly rawJSON: string
}
