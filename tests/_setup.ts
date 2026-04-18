expect.addEqualityTesters([
  function arrayishEquals(a, b, customTesters) {
    if (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.constructor !== b.constructor
    ) {
      return this.equals(Array.from(a), Array.from(b), customTesters)
    }
    return undefined
  }
])
