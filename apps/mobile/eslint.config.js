import base from '@cm/config/eslint';
import globals from 'globals';

export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // React Native/Expo carga assets estáticos con require(); permitirlo.
      '@typescript-eslint/no-require-imports': [
        'error',
        { allow: ['\\.(png|jpe?g|gif|webp|svg|ttf|otf|mp4|mp3|wav)$'] },
      ],
    },
  },
];
