import type { AdEventSink, AdProvider, AdShowOptions, RewardPayload } from '../types.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface MockAdProviderConfig {
  interstitialDurationMs?: number;
  rewardedDurationMs?: number;
  reward?: RewardPayload;
}

export class MockAdProvider implements AdProvider {
  readonly supportsInterstitial = true;
  readonly supportsRewarded = true;

  private sink?: AdEventSink;
  private readonly config: Required<MockAdProviderConfig>;

  constructor(config: MockAdProviderConfig = {}) {
    this.config = {
      interstitialDurationMs: config.interstitialDurationMs ?? 1200,
      rewardedDurationMs: config.rewardedDurationMs ?? 2200,
      reward: config.reward ?? { type: 'coins', amount: 25 }
    };
  }

  connect(sink: AdEventSink): void {
    this.sink = sink;
  }

  async initialize(): Promise<void> {
    this.sink?.emit('debug:message', {
      message: 'Mock ad provider initialized.'
    });
  }

  async showInterstitial(options?: AdShowOptions): Promise<void> {
    if (!this.sink) {
      throw new Error('MockAdProvider is not connected to an event sink.');
    }

    this.sink.emit('interstitial:opened', { placementId: options?.placementId });
    await delay(this.config.interstitialDurationMs);
    this.sink.emit('interstitial:closed', {
      placementId: options?.placementId,
      completed: true
    });
  }

  async showRewardedVideo(options?: AdShowOptions): Promise<void> {
    if (!this.sink) {
      throw new Error('MockAdProvider is not connected to an event sink.');
    }

    this.sink.emit('rewarded:opened', { placementId: options?.placementId });
    await delay(this.config.rewardedDurationMs / 2);
    this.sink.emit('rewarded:reward', {
      placementId: options?.placementId,
      reward: this.config.reward
    });
    await delay(this.config.rewardedDurationMs / 2);
    this.sink.emit('rewarded:closed', {
      placementId: options?.placementId,
      completed: true
    });
  }

  destroy(): void {
    this.sink = undefined;
  }
}
