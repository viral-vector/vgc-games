# Deployment Guide

This guide walks through building the Runner prototype for production, deploying
it to common static hosting providers, and wiring up analytics and ad
configuration.

## 1. Build the production bundle

The Runner game ships with a Vite-based build pipeline that emits hashed assets
and a manifest for cache busting.

```bash
pnpm install
pnpm build
```

The compiled site is written to `games/runner/dist/`. You can also target the
workspace directly:

```bash
pnpm --filter @vgc/game-runner build
```

## 2. Configure analytics

1. Create a Google Analytics 4 property.
2. Copy the measurement ID (e.g. `G-XXXXXXXXXX`).
3. Create `games/runner/.env.production` and add:

   ```bash
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

4. Re-run the production build. When the variable is omitted analytics calls are
   automatically no-ops.

Custom gameplay events are automatically dispatched for:

- Ad lifecycle hooks (opened, shown, failed)
- Run start, crash, and revives
- Reward claims including bonus metadata

## 3. Ad provider configuration

The Runner integrates the shared `@vgc/ad-service` package. In production you
should swap the mock provider for your live ad network SDK before deploying.

1. Update `packages/ad-service` with your provider implementation (credentials,
   placement IDs, etc.).
2. Verify rewarded ads emit `rewarded:reward` events with the correct payloads.
3. Build the game and ensure the ad network SDK scripts are hosted or loaded in
   your deployment environment.

## 4. Deploy to Firebase Hosting

1. Install the Firebase CLI and authenticate:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Initialize hosting from the repo root:

   ```bash
   firebase init hosting
   ```

   - Use `games/runner/dist` as the public directory.
   - Configure as a single-page app (rewrite all routes to `index.html`).

3. Build the site (`pnpm build`) and deploy:

   ```bash
   firebase deploy --only hosting
   ```

## 5. Deploy to Netlify

1. Create a new Netlify site and connect the repository or use drag-and-drop.
2. Set the build command to `pnpm --filter @vgc/game-runner build`.
3. Set the publish directory to `games/runner/dist`.
4. Add `VITE_GA_MEASUREMENT_ID` (and any ad provider keys) to the Netlify site
   environment variables.
5. Trigger a deploy. Netlify will cache hashed assets automatically.

## 6. Post-deployment checklist

- Verify analytics traffic is visible in the GA4 real-time dashboard.
- Confirm rewarded ads trigger and emit rewards in the production environment.
- Spot-check caching headers—hashed filenames allow aggressive CDN caching.
- Update any privacy policies or consent dialogs to reflect analytics usage.
