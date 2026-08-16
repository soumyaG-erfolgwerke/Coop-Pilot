import path from 'path'
import { fileURLToPath } from 'url'
import reactHooks from 'eslint-plugin-react-hooks'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default [
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**'],
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'no-unused-vars': 'off',
      'no-var': 'warn',
      'no-console': 'warn',
      'prefer-const': 'warn',
    },
  },
]
