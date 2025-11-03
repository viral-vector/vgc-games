module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
    tsconfigRootDir: process.cwd(),
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'jsdoc',
    'prettier'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jsdoc/recommended-typescript-error',
    'plugin:prettier/recommended'
  ],
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  settings: {
    jsdoc: {
      mode: 'typescript'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      }
    }
  },
  rules: {
    'prettier/prettier': 'warn',
    'import/no-default-export': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
};
