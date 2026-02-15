import { defineConfig } from 'vite';
import { name } from './package.json';
import { extractTypesFromDesignTokens } from './build/extractConstant';

const externalPackages = [];

export default defineConfig({
  plugins: [extractTypesFromDesignTokens()],
  build: {
    lib: {
      entry: 'src/index.js',
      name,
    },
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      output: [
        {
          format: 'es',
          entryFileNames: '[name].js',
          dir: 'dist',
        },
        {
          format: 'cjs',
          entryFileNames: '[name].cjs',
          dir: 'dist',
          exports: 'auto',
        },
      ],
      external: externalPackages,
    },
  },
});
