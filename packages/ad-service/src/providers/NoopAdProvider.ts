import type { AdEventSink, AdProvider, AdShowOptions } from '../types.js';

export class NoopAdProvider implements AdProvider {
  readonly supportsInterstitial = false;
  readonly supportsRewarded = false;

  private sink?: AdEventSink;

  connect(sink: AdEventSink): void {
    this.sink = sink;
  }

  async initialize(): Promise<void> {
    this.sink?.emit('debug:message', {
      message: 'Noop ad provider active – ad calls are ignored.'
    });
  }

  async showInterstitial(options?: AdShowOptions): Promise<void> {
    this.sink?.emit('debug:message', {
      message: 'Interstitial skipped (noop provider).',
      data: { placementId: options?.placementId }
    });
  }

  async showRewardedVideo(options?: AdShowOptions): Promise<void> {
    this.sink?.emit('debug:message', {
      message: 'Rewarded video skipped (noop provider).',
      data: { placementId: options?.placementId }
    });
  }

  destroy(): void {
    this.sink = undefined;
  }
}
