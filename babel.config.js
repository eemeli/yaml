module.exports = {
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    ['babel-plugin-trace', { strip: true }]
  ]
}

if (process.env.NODE_ENV === 'test')
  module.exports.presets = [['@babel/env', { targets: { node: 'current' } }]]
