module.exports = {
  overrides: [
    {
      test: /\.js$/,
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-nullish-coalescing-operator'
      ]
    },
    {
      test: /\.ts$/,
      plugins: [
        ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-nullish-coalescing-operator'
      ]
    }
  ]
}

if (process.env.NODE_ENV === 'test')
  module.exports.presets = [['@babel/env', { targets: { node: 'current' } }]]
