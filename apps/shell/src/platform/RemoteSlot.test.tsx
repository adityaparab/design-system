import type { RemoteModule } from '@verity/contracts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RemoteSlot } from './RemoteSlot';
import { IncompatibleRemoteError } from './remotes';

const meta = { contractVersion: '1.1.0', designSystemVersion: '1.0.0', buildId: 'test' };

function remote(Component: RemoteModule<{ label: string }>['Component']): RemoteModule<{ label: string }> {
  return { meta, Component };
}

describe('RemoteSlot', () => {
  it('renders the remote with the props the shell passes', async () => {
    const load = vi.fn().mockResolvedValue(remote(({ label }) => <p>remote says {label}</p>));
    render(<RemoteSlot id="reviewList" title="Document list" props={{ label: 'hi' }} load={load} />);
    expect(await screen.findByText('remote says hi')).toBeTruthy();
  });

  it('shows a retryable fallback when the remote cannot be fetched', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failed to load script resources'))
      .mockResolvedValue(remote(() => <p>recovered</p>));
    render(<RemoteSlot id="docViewer" title="Document viewer" props={{ label: '' }} load={load} />);
    expect((await screen.findByRole('alert')).textContent).toContain('Document viewer is unavailable');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('recovered')).toBeTruthy();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('refuses a remote built against an incompatible contract', async () => {
    const load = vi.fn().mockRejectedValue(new IncompatibleRemoteError('Remote targets contract v2.x'));
    render(<RemoteSlot id="docViewer" title="Document viewer" props={{ label: '' }} load={load} />);
    expect(await screen.findByText('Document viewer needs an update')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('contains a render crash and recovers when resetKey changes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Crashy = ({ label }: { label: string }) => {
      if (label === 'bad') throw new Error('boom');
      return <p>document {label}</p>;
    };
    const load = vi.fn().mockResolvedValue(remote(Crashy));
    const { rerender } = render(
      <>
        <RemoteSlot id="docViewer" title="Document viewer" props={{ label: 'bad' }} resetKey="1" load={load} />
        <p>sibling still renders</p>
      </>,
    );
    expect((await screen.findByRole('alert')).textContent).toContain('Document viewer crashed');
    expect(screen.getByText('sibling still renders')).toBeTruthy();

    rerender(
      <>
        <RemoteSlot id="docViewer" title="Document viewer" props={{ label: 'ok' }} resetKey="2" load={load} />
        <p>sibling still renders</p>
      </>,
    );
    await waitFor(() => expect(screen.getByText('document ok')).toBeTruthy());
  });
});
