import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.expo/**', 'supabase/functions/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { rules: { '@typescript-eslint/no-explicit-any': 'off', '@typescript-eslint/no-non-null-assertion': 'off' } },
  // Scripts de Node (semillas): globals del runtime.
  { files: ['**/*.mjs'], languageOptions: { globals: { URL: 'readonly', console: 'readonly', process: 'readonly' } } },
);
