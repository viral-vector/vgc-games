import EventEmitter from 'eventemitter3';
import type {
  AdEventListener,
  AdEventMap,
  AdEventName,
  AdProvider,
  AdShowOptions
} from './types.js';

export class AdService {
  private provider: AdProvider;
  private readonly emitter = new EventEmitter<AdEventMap>();

  constructor(provider: AdProvider) {
    this.provider = provider;
    this.provider.connect({
      emit: (event, payload) => {
        this.emitter.emit(event, payload);
      }
    });
  }

  setProvider(provider: AdProvider): void {
    if (this.provider === provider) {
      return;
    }

    this.provider.destroy();
    this.provider = provider;
    this.provider.connect({
      emit: (event, payload) => {
        this.emitter.emit(event, payload);
      }
    });
  }

  on<K extends AdEventName>(event: K, listener: AdEventListener<K>): () => void {
    const castListener = listener as unknown as (...args: unknown[]) => void;
    this.emitter.on(event, castListener);
    return () => {
      this.emitter.off(event, castListener);
    };
  }

  once<K extends AdEventName>(event: K, listener: AdEventListener<K>): () => void {
    const castListener = listener as unknown as (...args: unknown[]) => void;
    this.emitter.once(event, castListener);
    return () => {
      this.emitter.off(event, castListener);
    };
  }

  emit<K extends AdEventName>(event: K, payload: AdEventMap[K]): void {
    this.emitter.emit(event, payload);
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
  }

  async showInterstitial(options?: AdShowOptions): Promise<void> {
    if (!this.provider.supportsInterstitial) {
      this.emit('debug:message', {
        message: 'Interstitial ads are not supported by the active provider.'
      });
      return;
    }

    await this.provider.showInterstitial(options);
  }

  async showRewardedVideo(options?: AdShowOptions): Promise<void> {
    if (!this.provider.supportsRewarded) {
      this.emit('debug:message', {
        message: 'Rewarded videos are not supported by the active provider.'
      });
      return;
    }

    await this.provider.showRewardedVideo(options);
  }

  destroy(): void {
    this.provider.destroy();
    this.emitter.removeAllListeners();
  }
}
