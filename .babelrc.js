const plugins = [
  '@babel/plugin-proposal-class-properties',
  ['babel-plugin-trace', { strip: true }]
]
const envOptions = { modules: false, useBuiltIns: false }

if (process.env.BABEL_ENV !== 'browser') {
  plugins.push(['@babel/plugin-transform-modules-commonjs', { strict: true }])
  envOptions.targets = { node: '6.5' }
}

const presets = [['@babel/env', envOptions]]
module.exports = { presets, plugins }
