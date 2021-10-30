module.exports = {
  parser: 'esprima',
  parserOptions: {
    ecmaVersion: 8,
    // project: 'tsconfig.json',
    sourceType: 'module',
    allowImportExportEverywhere: true,
  },
  extends: ['plugin:prettier/recommended'],
  plugins: ['only-warn'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'prettier/prettier': 'warn',
  },
};
