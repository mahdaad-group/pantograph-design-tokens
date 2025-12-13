import { defineConfig } from 'vite';
import { name } from './package.json';
import designTokens from './src/designTokens.json';

const externalPackages = [];

function extractTypesFromDesignTokens() {
  return {
    name: 'extract-types-from-design-tokens',
    buildStart() {

      // Extract themes from Alias colors -> $extensions -> mode -> keys
      const themes = extractThemes(designTokens);

      // Extract langs from Typography -> $extensions -> mode -> keys
      const langs = extractLangs(designTokens);

      // Extract grayscales from Grayscales - Dark -> Grayscales -> $extensions -> mode -> keys
      const grayScales = extractGrayScales(designTokens);

      // Generate types.ts content
      const typesContent = `// This file is auto-generated from designTokens.json
// Do not edit manually

export declare type Langs = ${langs.length > 0 ? langs.map(lang => `'${lang}'`).join(' | ') : "'en' | 'fa'"};

export declare type Themes = ${themes.length > 0 ? themes.map(theme => `'${theme}'`).join(' | ') : "'oktuple' | 'claytap' | 'agility' | 'pantograph' | 'primeplanet'"};

export declare type GrayScales = ${grayScales.length > 0 ? grayScales.map(scale => `'${scale}'`).join(' | ') : "'arsenic' | 'cool' | 'warm' | 'neutral'"};
`;

      // Generate index.d.ts content (entry point for types)
      const indexTypesContent = `// Type definitions for @pantograph/design-tokens

export declare const designTokens: Record<string, any>;
export * from './types';
`;

      // Emit types.d.ts file for dist
      this.emitFile({
        type: 'asset',
        fileName: 'types.d.ts',
        source: typesContent,
      });

      // Emit index.d.ts file for dist
      this.emitFile({
        type: 'asset',
        fileName: 'index.d.ts',
        source: indexTypesContent,
      });

      console.log('✅ Generated types from designTokens.json');
      console.log(`   Themes: [${themes.join(', ')}]`);
      console.log(`   Langs: [${langs.join(', ')}]`);
      console.log(`   GrayScales: [${grayScales.join(', ')}]`);
    },
  };
}

function extractThemes(designTokens) {
  const themes = new Set();

  // Try different possible locations for themes
  const aliasColors = designTokens[' Alias colors'] || designTokens['Alias colors'];

  if (aliasColors) {
    // Look through all nested objects for mode keys
    function findModes(obj) {
      if (obj && typeof obj === 'object') {
        if (obj.$extensions?.mode) {
          Object.keys(obj.$extensions.mode).forEach(key =>
            themes.add(key.toLowerCase())
          );
        } else {
          Object.values(obj).forEach(findModes);
        }
      }
    }
    findModes(aliasColors);
  }

  return Array.from(themes);
}

function extractLangs(designTokens) {
  const langs = new Set();

  // Try Typography section
  const typography = designTokens['Typography'];
  if (typography) {
    function findModes(obj) {
      if (obj && typeof obj === 'object') {
        if (obj.$extensions?.mode) {
          Object.keys(obj.$extensions.mode).forEach(key =>
            langs.add(key.toLowerCase())
          );
        } else {
          Object.values(obj).forEach(findModes);
        }
      }
    }
    findModes(typography);
  }

  return Array.from(langs);
}

function extractGrayScales(designTokens) {
  const grayScales = new Set();

  // Grayscales - Dark -> Grayscales -> items -> $extensions -> mode -> keys
  const grayscalesDark = designTokens['Grayscales - Dark'];
  if (grayscalesDark?.Grayscales) {
    const items = Object.values(grayscalesDark.Grayscales);
    items.forEach((item) => {
      if (item?.$extensions?.mode) {
        Object.keys(item.$extensions.mode).forEach(key =>
          grayScales.add(key.toLowerCase())
        );
      }
    });
  }

  return Array.from(grayScales);
}

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
