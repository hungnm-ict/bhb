/**
 * Minimal synchronous event emitter.
 *
 * Exists so the engine can report state without importing the UI — the UI
 * subscribes, the engine stays testable headless.
 */
export function createEmitter() {
  /** @type {Map<string, Set<Function>>} */
  const handlers = new Map();

  return {
    /** @returns {() => void} unsubscribe */
    on(event, handler) {
      if (!handlers.has(event)) {
        handlers.set(event, new Set());
      }
      handlers.get(event).add(handler);
      return () => handlers.get(event)?.delete(handler);
    },

    emit(event, payload) {
      const listeners = handlers.get(event);
      if (!listeners) {
        return;
      }
      for (const handler of listeners) {
        try {
          handler(payload);
        } catch (error) {
          // One bad subscriber must not stop the others or the engine.
          console.error(`[BHB] handler for "${event}" threw`, error);
        }
      }
    },
  };
}
