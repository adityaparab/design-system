import { CONTRACT_VERSION, checkContractCompatibility } from '@verity/contracts';
import { Button, DESIGN_SYSTEM_VERSION, Panel, Stack, StatusTag, type StatusTone } from '@verity/design-system';
import { useState, useSyncExternalStore } from 'react';
import { loadRemoteModule, readShareScope, remoteStore, type RemoteId, type RemoteStatus } from '../platform/remotes';
import { telemetryStore } from '../platform/telemetry';

const STATUS_TONE: Record<RemoteStatus, StatusTone> = {
  idle: 'neutral',
  loading: 'info',
  ready: 'success',
  failed: 'danger',
  incompatible: 'warning',
};

const DRILLS = [
  {
    id: 'viewer-crash',
    title: 'Render crash',
    detail: 'The viewer remote throws while rendering. Its error boundary catches it; the list keeps working.',
  },
  {
    id: 'remote-offline',
    title: 'Remote offline',
    detail: 'The viewer remoteEntry.js points at a dead host (bad deploy, CDN outage). The slot shows a retryable fallback.',
  },
  {
    id: 'contract-mismatch',
    title: 'Contract mismatch',
    detail: 'The viewer reports contract 2.0.0 while the shell provides 1.x. The shell refuses to mount it instead of failing at runtime.',
  },
];

export function PlatformPage() {
  const remotes = useSyncExternalStore(remoteStore.subscribe, remoteStore.getSnapshot);
  const log = useSyncExternalStore(telemetryStore.subscribe, telemetryStore.getSnapshot);
  const [shared, setShared] = useState(readShareScope);

  const loadAll = async () => {
    await Promise.allSettled((['reviewList', 'docViewer'] as RemoteId[]).map((id) => loadRemoteModule(id)));
    setShared(readShareScope());
  };

  return (
    <div className="shell-platform">
      <h1 className="shell-platform__title">Platform inspector</h1>
      <p className="shell-platform__lede">
        Shell contract <code>{CONTRACT_VERSION}</code> · design system <code>{DESIGN_SYSTEM_VERSION}</code> (provided as a singleton)
      </p>

      <Panel title="Micro frontends" actions={<Button size="sm" onClick={loadAll}>Load all and refresh</Button>}>
        <table className="shell-table">
          <thead>
            <tr>
              <th scope="col">Remote</th>
              <th scope="col">Status</th>
              <th scope="col">Entry</th>
              <th scope="col">Load</th>
              <th scope="col">Contract</th>
              <th scope="col">Built with DS</th>
              <th scope="col">Build</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(remotes).map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.id}</th>
                <td>
                  <StatusTag tone={STATUS_TONE[r.status]}>{r.status}</StatusTag>
                  {r.error ? <div className="shell-table__note">{r.error}</div> : null}
                </td>
                <td>
                  <code>{r.entry}</code>
                </td>
                <td>{r.loadMs !== undefined ? `${r.loadMs} ms` : '–'}</td>
                <td>
                  {r.meta ? (
                    <>
                      <code>{r.meta.contractVersion}</code>{' '}
                      {checkContractCompatibility(r.meta.contractVersion, CONTRACT_VERSION).compatible ? '✓' : '✗'}
                    </>
                  ) : (
                    '–'
                  )}
                </td>
                <td>{r.meta ? <code>{r.meta.designSystemVersion}</code> : '–'}</td>
                <td>{r.meta ? <code>{r.meta.buildId}</code> : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Shared dependencies (Module Federation share scope)">
        <p className="shell-platform__hint">
          React and the design system are singletons. <code>date-fns</code> is shared by semver range, so review-list (v4) and
          doc-viewer (v3) each get their own major while minor versions dedupe.
        </p>
        {shared.length === 0 ? (
          <p>Nothing registered yet. Open the review page or use “Load all and refresh”.</p>
        ) : (
          <table className="shell-table">
            <thead>
              <tr>
                <th scope="col">Package</th>
                <th scope="col">Version</th>
                <th scope="col">Provided by</th>
                <th scope="col">Loaded</th>
                <th scope="col">Used by</th>
              </tr>
            </thead>
            <tbody>
              {shared.map((s) => (
                <tr key={`${s.pkg}@${s.version}`}>
                  <th scope="row">
                    <code>{s.pkg}</code>
                  </th>
                  <td>
                    <code>{s.version}</code>
                  </td>
                  <td>{s.from}</td>
                  <td>{s.loaded ? 'yes' : 'no'}</td>
                  <td>{s.usedBy.join(', ') || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Failure drills">
        <Stack as="ul" gap={3} padding={0}>
          {DRILLS.map((d) => (
            <li key={d.id} className="shell-drill">
              <a href={`/review/VRT-0000004?simulate=${d.id}`}>{d.title}</a>
              <span>{d.detail}</span>
            </li>
          ))}
        </Stack>
      </Panel>

      <Panel title="Telemetry (latest 50)">
        {log.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          <ol className="shell-log">
            {log.map((e) => (
              <li key={e.id} data-level={e.level}>
                <time dateTime={e.at}>{e.at.slice(11, 19)}</time> <strong>{e.level}</strong> {e.name}{' '}
                {e.context ? <code>{JSON.stringify(e.context)}</code> : null}
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
