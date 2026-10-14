import type { Telemetry } from '@verity/contracts';

export interface TelemetryEntry {
  id: number;
  at: string;
  level: 'error' | 'event';
  name: string;
  context?: Record<string, unknown>;
}

const MAX_ENTRIES = 50;
let entries: TelemetryEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function push(entry: Omit<TelemetryEntry, 'id' | 'at'>) {
  entries = [{ ...entry, id: nextId++, at: new Date().toISOString() }, ...entries].slice(0, MAX_ENTRIES);
  listeners.forEach((l) => l());
}

/**
 * In-memory stand-in for an observability SDK (Datadog RUM, Sentry, OpenTelemetry).
 * Every error carries the remote name and build id so an incident can be traced
 * to the deploy that caused it.
 */
export const telemetry: Telemetry = {
  error(error, context) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[telemetry]', message, context);
    push({ level: 'error', name: message, context });
  },
  event(name, data) {
    push({ level: 'event', name, context: data });
  },
};

export const telemetryStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => entries,
};
