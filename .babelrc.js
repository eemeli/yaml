module.exports = {
  presets: [['@babel/env', { targets: { node: '6.5' } }]],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    ['babel-plugin-trace', { strip: true }],
    ['babel-plugin-add-module-exports', { addDefaultProperty: true }]
  ]
}
