# Technology Stack Overview

## Core Frameworks and Tooling

### Phaser 3
- **Role**: Primary 2D game framework powering scene management, physics, input handling, and asset loading.
- **Integration Notes**: Works seamlessly with modern bundlers; type definitions improve development ergonomics when paired with TypeScript.

### TypeScript
- **Role**: Strongly typed superset of JavaScript used for gameplay logic, UI layers, and tooling scripts.
- **Benefits**: Provides compile-time checks, improved editor tooling, and refactoring confidence across the codebase.

### Vite Bundler
- **Role**: Development server and build tool for rapid iteration.
- **Key Features**: Lightning-fast hot module replacement for Phaser scenes, native TypeScript support, and optimized production builds with code-splitting.

### ESLint & Prettier
- **Role**: Linting and formatting toolchain.
- **Usage**: ESLint enforces code-quality rules tailored to TypeScript and Phaser-specific patterns, while Prettier standardizes formatting to minimize diffs and onboarding friction.

### Jest (Optional)
- **Role**: Unit testing framework for non-visual game logic, utility functions, and deterministic systems.
- **Considerations**: While not required for every prototype, Jest is valuable for regression coverage on math-heavy mechanics and serialization pipelines.

## Advertising Strategy
- **Platform**: Google Ad Manager orchestrates ad inventory, targeting, and reporting.
- **Ad Formats**:
  - **Rewarded Video**: Delivered via DOM overlays that pause gameplay, granting in-game currency or retries upon completion.
  - **Interstitial**: Triggered at natural breakpoints (level transitions, menu navigation) through DOM-managed modals that ensure focus without interfering with the Phaser canvas.
- **Implementation Notes**: Bridge DOM overlays with Phaser scene lifecycle hooks to pause/resume audio and input, and reuse a lightweight messaging layer for analytics callbacks.

## Content Pipeline Dependencies
- **Phaser 3**: `phaser` npm package for engine functionality.
- **TypeScript**: `typescript` compiler plus `ts-node` or Vite-integrated tooling for scripts.
- **Vite**: `vite` for dev server/build, plus `@vitejs/plugin-react` or comparable plugins if UI overlays need React.
- **ESLint & Prettier**: `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-import`, and `prettier` ensure consistent style.
- **Jest**: `jest`, `ts-jest`, and `@types/jest` to support TypeScript-driven tests.
- **Ad Integration**: `@googleads/google-publisher-tag` for Google Ad Manager tag loading and potential wrappers for rewarded/interstitial logic.

## Art & Asset Pipeline
- **Aseprite**: Pixel art editor; use the CLI export (`aseprite --batch`) to output spritesheets and JSON data compatible with Phaser's `AtlasJSON` loader. Automates color palette management and frame tagging.
- **TexturePacker**: Optimizes sprite atlases, trims transparent pixels, and generates multi-resolution atlases to reduce load times when bundling with Vite.
- **Procedural Concepting Tools**: Services like Midjourney or Stable Diffusion accelerate concept iterations. Curated prompt libraries help generate thematic references, which are then repainted or traced in Aseprite for production-ready assets.
- **Audio Tooling (Optional)**: Tools such as Bfxr or ChipTone can be integrated for retro sound effects, exported as lossless audio before conversion.

## Dependency Justification
- Combining Aseprite and TexturePacker keeps pixel art workflows efficient: Aseprite handles creation/animation, while TexturePacker compacts assets for runtime performance.
- AI-assisted ideation via Midjourney or Stable Diffusion accelerates pre-production mood boarding, but final assets remain hand-tuned for clarity and licensing certainty.
- Google Ad Manager tooling ensures monetization can scale with targeted placements without embedding heavy SDKs directly inside the Phaser rendering loop.
- The coding toolchain (TypeScript, Vite, ESLint/Prettier, Jest) maximizes iteration speed and code reliability, ensuring gameplay features and ad hooks remain maintainable.
