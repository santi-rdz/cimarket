import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.expo/**',
      '**/coverage/**',
      'pnpm-lock.yaml',
      '**/.turbo/**',
      '**/*.d.ts',
    ],
  },
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },

    rules: {
      'no-debugger': 'error',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

      // ts
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
);
