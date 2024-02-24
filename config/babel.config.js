module.exports = {
  overrides: [
    {
      test: /\.js$/,
      plugins: [
        '@babel/plugin-transform-class-properties',
        '@babel/plugin-transform-nullish-coalescing-operator'
      ]
    },
    {
      test: /\.ts$/,
      plugins: [
        ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
        '@babel/plugin-transform-class-properties',
        '@babel/plugin-transform-nullish-coalescing-operator'
      ]
    }
  ]
}

if (process.env.NODE_ENV === 'test')
  module.exports.presets = [['@babel/env', { targets: { node: 'current' } }]]
