import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import designTokens from '../src/designTokens.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function extractTypesFromDesignTokens() {
  return {
    name: 'extract-types-from-design-tokens',
    buildStart() {
      // Extract themes from Alias colors -> $extensions -> mode -> keys
      const themes = extractThemes(designTokens);

      // Extract langs from Typography -> $extensions -> mode -> keys
      const langs = extractLangs(designTokens);

      // Extract grayscales from Grayscales - Dark -> Grayscales -> $extensions -> mode -> keys
      const grayScales = extractGrayScales(designTokens);

      // Extract primitive colors from Primitive Colors: keys like --ptp-*-0 → primitive name
      const primitiveColors = extractPrimitiveColors(designTokens);

      // Extract alias color names from Alias colors: keys like --pta-* → alias name
      const aliasColors = extractAliasColors(designTokens);

      // Extract dimension scale names from Dimensions: keys like --ptp-dimension-* → scale (e.g. 0, 100, 200)
      const dimensions = extractDimensions(designTokens);

      // Write src/constant.js (primitiveColors + aliasColors + dimensions)
      const constantPath = path.resolve(path.dirname(__dirname), 'src', 'constant.js');
      const constantContent = `// This file is auto-generated from designTokens.json during build
// Do not edit manually

export const primitiveColors = Object.freeze(${JSON.stringify(primitiveColors)});

export const aliasColors = Object.freeze(${JSON.stringify(aliasColors)});

export const dimensions = Object.freeze(${JSON.stringify(dimensions)});
`;
      fs.writeFileSync(constantPath, constantContent, 'utf8');

      // Design tokens structure types (from W3C Design Tokens format)
      const designTokensTopLevelKeys = Object.keys(designTokens)
        .map((k) => (k.includes('"') || k.includes("'") ? null : JSON.stringify(k)))
        .filter(Boolean);
      const designTokensSections = designTokensTopLevelKeys
        .map((q) => `${q}?: DesignTokenGroup;`)
        .join('\n  ');

      // Generate index.d.ts content (entry point for types)
      const indexTypesContent = `// Type definitions for @pantograph/design-tokens

/** Token $extensions (mode, figma, etc.) */
export interface DesignTokenExtensions {
  mode?: Record<string, string>;
  figma?: {
    codeSyntax?: Record<string, string>;
    variableId?: string;
    collection?: { id?: string; name?: string; defaultModeId?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
/** Single design token (color, dimension, string, etc.) */
export interface DesignToken {
  $type: 'color' | 'dimension' | 'string' | 'fontFamily' | 'number' | 'cubicBezier' | 'strokeStyle' | 'border';
  $value: string;
  $description?: string;
  scopes?: string[];
  $extensions?: DesignTokenExtensions;
}
/** Nested group of tokens or subgroups */
export type DesignTokenGroup = { [key: string]: DesignToken | DesignTokenGroup };
/** Root design tokens: known sections + index signature for future keys */
export interface DesignTokens {
  ${designTokensSections}
  [key: string]: DesignTokenGroup | undefined;
}
export declare type Langs = ${langs.length > 0 ? langs.map((lang) => `'${lang}'`).join(' | ') : "'en' | 'fa'"};
export declare type Themes = ${themes.length > 0 ? themes.map((theme) => `'${theme}'`).join(' | ') : "'oktuple' | 'claytap' | 'agility' | 'pantograph' | 'primeplanet'"};
export declare type GrayScales = ${grayScales.length > 0 ? grayScales.map((scale) => `'${scale}'`).join(' | ') : "'arsenic' | 'cool' | 'warm' | 'neutral'"};
export declare type PrimitiveColors = ${primitiveColors.length > 0 ? primitiveColors.map((c) => `'${c}'`).join(' | ') : 'never'};
export declare type AliasColors = ${aliasColors.length > 0 ? aliasColors.map((c) => `'${c}'`).join(' | ') : 'never'};
export declare type Dimensions = ${dimensions.length > 0 ? dimensions.map((d) => `'${d}'`).join(' | ') : 'never'};
export declare const designTokens: DesignTokens;
export declare const primitiveColors: readonly PrimitiveColors[];
export declare const aliasColors: readonly AliasColors[];
export declare const dimensions: readonly Dimensions[];
`;

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
      console.log(`   PrimitiveColors: [${primitiveColors.join(', ')}]`);
      console.log(`   AliasColors: [${aliasColors.join(', ')}]`);
      console.log(`   Dimensions: [${dimensions.join(', ')}]`);
    },
  };
}

/**
 * Extract primitive color names from "Primitive Colors".
 * For each key matching --ptp-NAME-0, returns NAME (e.g. blue, gray-inverse).
 */
function extractPrimitiveColors(designTokens) {
  const names = new Set();
  const primitiveColorsSection = designTokens['Primitive Colors'];
  if (!primitiveColorsSection || typeof primitiveColorsSection !== 'object') {
    return [];
  }
  Object.values(primitiveColorsSection).forEach((item) => {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach((key) => {
        const match = key.match(/^--ptp-(.+)-0$/);
        if (match) names.add(match[1]);
      });
    }
  });
  return Array.from(names).sort();
}

/**
 * Extract alias color names from "Alias colors" / " Alias colors".
 * For each key matching --pta-NAME, returns NAME (e.g. primary-fill, primary-fill-hover).
 */
function extractAliasColors(designTokens) {
  const names = new Set();
  const section = designTokens[' Alias colors'] || designTokens['Alias colors'];
  if (!section || typeof section !== 'object') return [];
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((key) => {
      const match = key.match(/^--pta-(.+)$/);
      if (match) names.add(match[1]);
      else walk(obj[key]);
    });
  }
  walk(section);
  return Array.from(names).sort();
}

/**
 * Extract dimension scale names from " Dimensions" / "Dimensions".
 * For each key matching --ptp-dimension-NAME, returns NAME (e.g. 0, 100, 200, 050).
 */
function extractDimensions(designTokens) {
  const names = new Set();
  const section = designTokens[' Dimensions'] || designTokens['Dimensions'];
  if (!section || typeof section !== 'object') return [];
  Object.keys(section).forEach((key) => {
    const match = key.match(/^--ptp-dimension-(.+)$/);
    if (match) names.add(match[1]);
  });
  return Array.from(names).sort();
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
          Object.keys(obj.$extensions.mode).forEach((key) => themes.add(key.toLowerCase()));
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
          Object.keys(obj.$extensions.mode).forEach((key) => langs.add(key.toLowerCase()));
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
        Object.keys(item.$extensions.mode).forEach((key) => grayScales.add(key.toLowerCase()));
      }
    });
  }

  return Array.from(grayScales);
}
