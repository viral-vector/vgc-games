# @vgc/ad-service

Lightweight wrapper around an ad provider SDK used by VGC games. The package exports
an event-driven API that games can consume as well as helpers for wiring the service
into Phaser scenes. The initial implementation ships with a mock provider and a
fallback no-op provider for local development.

## Usage

```ts
import { adService, registerAdSceneEvents } from '@vgc/ad-service';

export default class GameScene extends Phaser.Scene {
  create(): void {
    registerAdSceneEvents(this);

    this.input.once('pointerdown', () => {
      adService.showInterstitial({ placementId: 'level_start' });
    });
  }
}
```

The helper forwards service events through the scene event emitter, e.g.:

```ts
this.events.on('ad.rewarded.reward', ({ reward }) => {
  grantPlayerReward(reward);
});
```

Switch to the no-op provider when a network SDK is not available:

```ts
import { adService, createNoopAdProvider } from '@vgc/ad-service';

adService.setProvider(createNoopAdProvider());
```
