const isBrowser = process.env.BABEL_ENV === 'browser'

const envOptions = { useBuiltIns: false }
if (!isBrowser) envOptions.targets = { node: '6.5' }
const presets = [['@babel/env', envOptions]]

const plugins = [
  '@babel/plugin-proposal-class-properties',
  ['babel-plugin-trace', { strip: true }]
]
if (isBrowser) plugins.push('@babel/plugin-transform-runtime')

module.exports = { presets, plugins }
