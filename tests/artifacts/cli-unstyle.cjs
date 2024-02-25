/** @type {import('../../src/index').visitor} */
module.exports = {
  Collection(_, node) {
    delete node.flow
  },
  Scalar(_, node) {
    delete node.format
    delete node.type
  }
}
