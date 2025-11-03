# Runner – Endless Sprint Prototype

This workspace hosts an endless runner built with Phaser 3 and Vite. Dodge procedurally
spawned hazards, chain double jumps, and collect sponsor rewards to push your high score.

## Available Scripts

- `pnpm dev` – start the development server with hot module replacement.
- `pnpm build` – build the production bundle.
- `pnpm preview` – preview the production build locally.
- `pnpm lint` – run ESLint using the shared configuration in `@vgc/config-eslint`.
- `pnpm test` – execute lightweight Vitest coverage for the runner difficulty helpers.

Production builds emit hashed file names and a Vite manifest. Run `pnpm build` (or
`pnpm --filter @vgc/game-runner build` from the repo root) to generate the
`dist/` directory ready for static hosting.

## Project Structure

- `src/main.ts` bootstraps the Phaser game instance and Arcade physics.
- `src/scenes/MainScene.ts` implements the full gameplay loop, HUD, controls, and ad hooks.
- `src/game/difficulty.ts` contains shared difficulty helpers covered by `vitest`.
- `tsconfig.json` extends the shared TypeScript configuration provided in `packages/config/typescript`.
- `src/analytics.ts` loads Google Analytics (when configured) and exposes helpers for
  dispatching custom gameplay events.

## Controls

- **Tap / Click / Space / Up Arrow** – jump. Double jump to save a misstep.
- Survive as long as possible; rewarded ads trigger at the start and end of each run to grant
  bonus score.

## Analytics Configuration

The runner integrates lightweight Google Analytics tracking. Provide a
measurement ID via `.env`:

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

When the variable is omitted the analytics module gracefully falls back to
console debug logs in development builds.
