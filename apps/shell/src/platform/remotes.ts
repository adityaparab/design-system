import { getInstance, loadRemote, registerRemotes } from '@module-federation/runtime';
import { checkContractCompatibility, CONTRACT_VERSION, type RemoteMeta, type RemoteModule } from '@verity/contracts';
import { currentSimulation } from './simulation';
import { telemetry } from './telemetry';

export type RemoteId = 'reviewList' | 'docViewer';

const EXPOSED: Record<RemoteId, string> = {
  reviewList: 'reviewList/ReviewList',
  docViewer: 'docViewer/DocViewer',
};

export type RemoteStatus = 'idle' | 'loading' | 'ready' | 'failed' | 'incompatible';

export interface RemoteState {
  id: RemoteId;
  entry: string;
  status: RemoteStatus;
  loadMs?: number;
  meta?: RemoteMeta;
  error?: string;
}

export class IncompatibleRemoteError extends Error {}

const LOAD_TIMEOUT_MS = 10_000;

let manifest: Record<RemoteId, { entry: string }> | null = null;
let states: Record<RemoteId, RemoteState> = {
  reviewList: { id: 'reviewList', entry: '', status: 'idle' },
  docViewer: { id: 'docViewer', entry: '', status: 'idle' },
};
const listeners = new Set<() => void>();
const cache = new Map<RemoteId, Promise<RemoteModule<unknown>>>();

function update(id: RemoteId, patch: Partial<RemoteState>) {
  states = { ...states, [id]: { ...states[id], ...patch } };
  listeners.forEach((l) => l());
}

export const remoteStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => states,
};

/** Fetches the per-environment registry and registers every remote with the MF runtime. */
export async function initRemotes(): Promise<void> {
  const response = await fetch('/remotes.json', { cache: 'no-store' });
  const registry = (await response.json()) as Record<RemoteId, { entry: string }>;
  if (currentSimulation() === 'remote-offline') {
    // Nothing listens on this port: the remoteEntry request fails like a bad deploy or CDN outage.
    registry.docViewer = { entry: 'http://localhost:5199/remoteEntry.js' };
  }
  manifest = registry;
  for (const id of Object.keys(EXPOSED) as RemoteId[]) update(id, { entry: registry[id].entry });
  registerRemotes((Object.keys(EXPOSED) as RemoteId[]).map((name) => ({ name, entry: registry[name].entry, type: 'module' })));
}

const timeout = <T,>(promise: Promise<T>, ms: number, id: RemoteId) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${id} did not load within ${ms / 1000}s`)), ms)),
  ]);

/**
 * Loads an exposed module once, validates it against the RemoteModule contract
 * and the shell's contract version, and records timing for the inspector.
 */
export function loadRemoteModule<P>(id: RemoteId): Promise<RemoteModule<P>> {
  const cached = cache.get(id);
  if (cached) return cached as Promise<RemoteModule<P>>;

  const started = performance.now();
  update(id, { status: 'loading', error: undefined });
  const promise = timeout(loadRemote<{ default?: RemoteModule<P> }>(EXPOSED[id]), LOAD_TIMEOUT_MS, id)
    .then((mod) => {
      const remote = mod?.default;
      if (!remote?.Component || !remote.meta) throw new Error(`${id} does not export a RemoteModule`);
      const meta =
        currentSimulation() === 'contract-mismatch' && id === 'docViewer' ? { ...remote.meta, contractVersion: '2.0.0' } : remote.meta;
      const compatibility = checkContractCompatibility(meta.contractVersion, CONTRACT_VERSION);
      if (!compatibility.compatible) {
        update(id, { status: 'incompatible', meta, error: compatibility.reason });
        throw new IncompatibleRemoteError(compatibility.reason);
      }
      const loadMs = Math.round(performance.now() - started);
      update(id, { status: 'ready', meta, loadMs });
      telemetry.event('remote.loaded', { remote: id, loadMs, buildId: meta.buildId });
      return { ...remote, meta };
    })
    .catch((error: unknown) => {
      cache.delete(id);
      if (!(error instanceof IncompatibleRemoteError)) {
        update(id, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
      }
      telemetry.error(error, { remote: id, entry: states[id].entry });
      throw error;
    });
  cache.set(id, promise as Promise<RemoteModule<unknown>>);
  return promise;
}

/** Clears the runtime's cached (failed) entry so the next load really refetches it. */
export function resetRemote(id: RemoteId) {
  cache.delete(id);
  if (manifest) registerRemotes([{ name: id, entry: manifest[id].entry, type: 'module' }], { force: true });
}

/** Warm a remote in the background (e.g. the viewer while the reviewer scans the list). */
export function prefetchRemote(id: RemoteId) {
  const run = () => void loadRemoteModule(id).catch(() => undefined);
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 2000 });
  else setTimeout(run, 500);
}

export interface SharedEntry {
  pkg: string;
  version: string;
  from: string;
  loaded: boolean;
  usedBy: string[];
}

/** Snapshot of the Module Federation share scope: who provides which version of what. */
export function readShareScope(): SharedEntry[] {
  const scope = getInstance()?.shareScopeMap?.default ?? {};
  const rows: SharedEntry[] = [];
  for (const [pkg, versions] of Object.entries(scope)) {
    if (pkg.includes('/') && !pkg.startsWith('@')) continue; // skip subpath entries like react/jsx-runtime
    if (pkg.startsWith('@') && pkg.split('/').length > 2) continue;
    for (const [version, shared] of Object.entries(versions)) {
      const s = shared as { from: string; loaded?: boolean; useIn?: string[] };
      rows.push({ pkg, version, from: s.from, loaded: Boolean(s.loaded), usedBy: s.useIn ?? [] });
    }
  }
  return rows.sort((a, b) => a.pkg.localeCompare(b.pkg) || a.version.localeCompare(b.version));
}
