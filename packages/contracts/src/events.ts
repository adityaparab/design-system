import type { CodingDecision } from './api';

/** Every cross-micro-frontend event, with its payload. Adding one is a minor contract bump. */
export interface PlatformEventMap {
  /** A document was saved with a coding decision. */
  'document.coded': { documentId: string; decision: CodingDecision; privileged: boolean };
  /** The viewer asks the list to open the next document ("save and next"). */
  'review.advance': { fromDocumentId: string };
}

export type PlatformEventType = keyof PlatformEventMap;
export type PlatformEventHandler<K extends PlatformEventType> = (payload: PlatformEventMap[K]) => void;

export interface PlatformEvents {
  emit<K extends PlatformEventType>(type: K, payload: PlatformEventMap[K]): void;
  /** Returns an unsubscribe function. */
  on<K extends PlatformEventType>(type: K, handler: PlatformEventHandler<K>): () => void;
}

/**
 * Tiny typed pub/sub owned by the shell. Remotes never talk to each other directly;
 * they emit and subscribe through the instance the shell passes in props.
 */
export function createEventBus(onError?: (error: unknown, type: PlatformEventType) => void): PlatformEvents {
  const handlers = new Map<PlatformEventType, Set<(payload: never) => void>>();
  return {
    emit(type, payload) {
      for (const handler of handlers.get(type) ?? []) {
        try {
          (handler as PlatformEventHandler<typeof type>)(payload);
        } catch (error) {
          // One faulty subscriber (one remote) must not break the others.
          onError?.(error, type);
        }
      }
    },
    on(type, handler) {
      const set = handlers.get(type) ?? new Set();
      set.add(handler as (payload: never) => void);
      handlers.set(type, set);
      return () => set.delete(handler as (payload: never) => void);
    },
  };
}
