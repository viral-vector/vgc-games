export { AdService } from './AdService.js';
export { registerAdSceneEvents } from './phaser/registerAdSceneEvents.js';
export { MockAdProvider, type MockAdProviderConfig } from './providers/MockAdProvider.js';
export { NoopAdProvider } from './providers/NoopAdProvider.js';
export {
  adService,
  createNoopAdProvider,
  getAdService,
  onAdEvent,
  setSharedAdService,
  showInterstitial,
  showRewardedVideo
} from './service.js';
export type {
  AdEventListener,
  AdEventMap,
  AdEventName,
  AdProvider,
  AdShowOptions,
  RewardPayload
} from './types.js';
