import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'

const base = {
	languageOptions: { ecmaVersion: 2023, sourceType: 'module', parser: tsParser },
	plugins: { '@typescript-eslint': tsPlugin, 'simple-import-sort': simpleImportSort },
	rules: {
		...js.configs.recommended.rules,
		...tsPlugin.configs.recommended.rules,
		'no-undef': 'off',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
		'simple-import-sort/imports': ['error', { groups: [['^react', '^node:', '^@?\\w'], ['^@/'], ['^\\.\\.'], ['^\\.'], ['^.+\\.css$']] }],
	},
}

export default [
	{ ignores: ['node_modules', 'web/dist', 'propuesta', 'scripts', 'eslint.config.js'] },
	{ ...base, files: ['src/**/*.ts', 'test/**/*.ts', 'bin/**/*.js'], languageOptions: { ...base.languageOptions, globals: globals.node } },
	{
		...base,
		files: ['web/**/*.{ts,tsx}'],
		languageOptions: { ...base.languageOptions, globals: globals.browser },
		plugins: { ...base.plugins, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
		rules: { ...base.rules, ...reactHooks.configs.recommended.rules, 'react-refresh/only-export-components': ['warn', { allowConstantExport: true }] },
	},
]
