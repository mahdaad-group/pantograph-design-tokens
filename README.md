# @pantograph/design-tokens

Design tokens exported from Figma for the Pantograph project.

## Installation

```bash
npm install @pantograph/design-tokens
```

## Usage

```javascript
// Import design tokens
import { designTokens } from '@pantograph/design-tokens';

// Import types
import { type Langs, type Themes, type GrayScales } from '@pantograph/design-tokens';

// Or import everything
import { designTokens, type Langs, type Themes, type GrayScales } from '@pantograph/design-tokens';
```

## Available Exports

### Design Tokens
- `designTokens`: Complete design tokens JSON object

### Constants
- `langs`: Available languages `['fa', 'en']`
- `themes`: Available themes `['oktuple', 'claytap', 'agility', 'pantograph', 'primeplanet']`
- `grayScales`: Available gray scales `['arsenic', 'cool', 'warm', 'neutral']`

### Types (Union Types)
- `Langs`: `'fa' | 'en'`
- `Themes`: `'oktuple' | 'claytap' | 'agility' | 'pantograph' | 'primeplanet'`
- `GrayScales`: `'arsenic' | 'cool' | 'warm' | 'neutral'`

## Build

The package includes a build system that automatically generates TypeScript types from the design tokens JSON file. To rebuild after updating `designTokens.json`:

```bash
npm run build
```

## Author

**sedmedgh** - [sedmedgh@gmail.com](mailto:sedmedgh@gmail.com)

## License

This project is licensed under the MIT License.

## Direct JSON Access

You can also access the raw JSON file directly:

```javascript
import { designTokens } from '@pantograph/design-tokens';
```
