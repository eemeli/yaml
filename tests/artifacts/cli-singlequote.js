/** @type {import('../../src/index').visitor} */
export default {
  Scalar(_, node) {
    node.type = 'QUOTE_SINGLE'
  }
}
