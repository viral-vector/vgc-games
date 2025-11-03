const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let analyticsLoaded = false;

const noop = () => undefined;

function ensureDataLayer(): void {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]): void {
      window.dataLayer?.push(args);
    };
  }
}

function appendAnalyticsScript(): void {
  if (document.querySelector<HTMLScriptElement>('script[data-source="gtag"]')) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  script.dataset.source = 'gtag';
  document.head.appendChild(script);
}

export function initializeAnalytics(): void {
  if (analyticsLoaded || !MEASUREMENT_ID) {
    return;
  }

  ensureDataLayer();
  appendAnalyticsScript();

  window.gtag?.('js', new Date());
  window.gtag?.('config', MEASUREMENT_ID, {
    send_page_view: false
  });

  analyticsLoaded = true;
}

export type AnalyticsEventPayload = Record<string, string | number | boolean | undefined>;

export function trackEvent(eventName: string, payload: AnalyticsEventPayload = {}): void {
  if (!MEASUREMENT_ID) {
    if (import.meta.env.DEV) {
      console.debug('[analytics]', eventName, payload);
    }
    return;
  }

  ensureDataLayer();
  (window.gtag ?? noop)('event', eventName, payload);
}

export function trackError(eventName: string, payload: AnalyticsEventPayload = {}): void {
  trackEvent(eventName, { ...payload, error: true });
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
