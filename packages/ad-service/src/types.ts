export interface AdShowOptions {
  /** Identifier representing where the ad is displayed (e.g. level_end). */
  placementId?: string;
  /** Enable verbose logging for the request lifecycle. */
  debug?: boolean;
}

export interface RewardPayload {
  type: string;
  amount: number;
}

export type AdEventMap = {
  'interstitial:opened': { placementId?: string };
  'interstitial:closed': { placementId?: string; completed: boolean };
  'rewarded:opened': { placementId?: string };
  'rewarded:reward': { placementId?: string; reward: RewardPayload };
  'rewarded:closed': { placementId?: string; completed: boolean };
  'debug:message': { message: string; data?: Record<string, unknown> };
  error: { message: string; cause?: unknown };
};

export type AdEventName = keyof AdEventMap;

export type AdEventListener<K extends AdEventName> = (payload: AdEventMap[K]) => void;

export interface AdEventSink {
  emit<K extends AdEventName>(event: K, payload: AdEventMap[K]): void;
}

export interface AdProvider {
  readonly supportsInterstitial: boolean;
  readonly supportsRewarded: boolean;
  connect(sink: AdEventSink): void;
  initialize(): Promise<void>;
  showInterstitial(options?: AdShowOptions): Promise<void>;
  showRewardedVideo(options?: AdShowOptions): Promise<void>;
  destroy(): void;
}
