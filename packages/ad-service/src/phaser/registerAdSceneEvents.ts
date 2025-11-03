import Phaser from 'phaser';
import { getAdService } from '../service.js';
import type { AdEventMap, AdEventName } from '../types.js';
import type { AdService } from '../AdService.js';

const forwardEvent = <K extends AdEventName>(
  scene: Phaser.Scene,
  event: K,
  payload: AdEventMap[K]
): void => {
  scene.events.emit(`ad.${event.replace(':', '.')}`, payload);
};

/**
 * Bridge ad service events into a Phaser scene event emitter. All events are prefixed with
 * `ad.` and `:` is replaced with `.` for easier listening (e.g. `ad.rewarded.closed`).
 *
 * @param scene Phaser scene that should emit ad related events
 * @param service Optional ad service instance. Defaults to the shared singleton
 * @returns Function to remove all listeners. Automatically invoked on scene shutdown.
 */
export const registerAdSceneEvents = (
  scene: Phaser.Scene,
  service: AdService = getAdService()
): (() => void) => {
  const subscriptions: Array<() => void> = [];
  const adEvents: AdEventName[] = [
    'interstitial:opened',
    'interstitial:closed',
    'rewarded:opened',
    'rewarded:reward',
    'rewarded:closed',
    'debug:message',
    'error'
  ];

  for (const event of adEvents) {
    const unsubscribe = service.on(event, (payload) => forwardEvent(scene, event, payload));
    subscriptions.push(unsubscribe);
  }

  const teardown = () => {
    while (subscriptions.length > 0) {
      const unsubscribe = subscriptions.pop();
      unsubscribe?.();
    }
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, teardown);
  scene.events.once(Phaser.Scenes.Events.DESTROY, teardown);

  return () => {
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, teardown);
    scene.events.off(Phaser.Scenes.Events.DESTROY, teardown);
    teardown();
  };
};
