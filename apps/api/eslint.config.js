import base from '@cm/config/eslint';
import pluginN from 'eslint-plugin-n';
import globals from 'globals';
export default [
  ...base,
  {
    ignores: ['src/generated/**'],
  },
  {
    plugins: {
      n: pluginN,
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      ...pluginN.configs['flat/recommended'].rules,
      'n/no-unpublished-import': 'off',
      'n/no-extraneous-import': 'off',
    },
  },
];
