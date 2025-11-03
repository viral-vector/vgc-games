import { AdService } from './AdService.js';
import type { AdEventListener, AdEventName, AdShowOptions } from './types.js';
import { MockAdProvider } from './providers/MockAdProvider.js';
import { NoopAdProvider } from './providers/NoopAdProvider.js';

let sharedService: AdService | undefined;

const defaultService = new AdService(new MockAdProvider());

export const adService = defaultService;

export const getAdService = (): AdService => sharedService ?? defaultService;

export const setSharedAdService = (service: AdService | undefined): void => {
  sharedService = service;
};

export const createNoopAdProvider = (): NoopAdProvider => new NoopAdProvider();

export const showInterstitial = (options?: AdShowOptions): Promise<void> =>
  getAdService().showInterstitial(options);

export const showRewardedVideo = (options?: AdShowOptions): Promise<void> =>
  getAdService().showRewardedVideo(options);

export const onAdEvent = <K extends AdEventName>(
  event: K,
  listener: AdEventListener<K>
): (() => void) => getAdService().on(event, listener);
