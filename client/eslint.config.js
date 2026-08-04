import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'

export default [
  { ignores: ['dist', 'dev-dist', 'node_modules', '*.min.js', '*.bundle.js'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      // NDEFReader is the experimental Web NFC API (used by the kiosk NFC flow); not yet in globals.browser.
      globals: { ...globals.browser, NDEFReader: 'readonly' },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Capitalized identifiers are components/constructors — often destructured (e.g. `icon: Icon`)
      // and used only in JSX, which core no-unused-vars doesn't count as a use. Ignore them for
      // both vars and args so JSX-rendered components aren't false-flagged as unused.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
      // JSX awareness — deliberately just these two rules, NOT eslint-plugin-react's full recommended
      // preset (which would add prop-types/etc. and a large warning backlog):
      //   jsx-uses-vars: count `<Component/>` as a use so it isn't reported unused.
      //   jsx-no-undef:  flag `<Component/>` when the component isn't defined — turns a silent
      //                  runtime "X is not defined" crash into a caught lint error.
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
