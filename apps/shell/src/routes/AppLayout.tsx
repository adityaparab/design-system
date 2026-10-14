import { Button, Kbd, SegmentedControl, TENANTS, type TenantId } from '@verity/design-system';
import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router';
import { useSession } from '../platform/session';
import { currentSimulation } from '../platform/simulation';
import { ShortcutsDialog } from './ShortcutsDialog';

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export function AppLayout() {
  const { session, signOut, setTenant } = useSession();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();
  const simulation = currentSimulation();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '?' && !isTyping(event.target)) {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="shell">
      <a className="shell__skip" href="#main">
        Skip to main content
      </a>
      <header className="shell__bar">
        <div className="shell__brand">
          <span className="shell__logo" aria-hidden="true">
            V
          </span>
          Verity <span className="shell__product">Review</span>
        </div>
        <nav aria-label="Primary" className="shell__nav">
          <NavLink to={{ pathname: '/review', search: location.search }}>Review</NavLink>
          <NavLink to={{ pathname: '/platform', search: location.search }}>Platform</NavLink>
        </nav>
        <span className="shell__matter">Matter: Atlas merger second request</span>
        {simulation ? (
          <a className="shell__sim" href={location.pathname}>
            Drill: {simulation} (clear)
          </a>
        ) : null}
        <div className="shell__spacer" />
        <SegmentedControl
          label="Tenant theme"
          size="sm"
          value={session.tenant as TenantId}
          onChange={setTenant}
          options={TENANTS.map((t) => ({ value: t.id, label: t.name }))}
        />
        <Button size="sm" variant="ghost" keyShortcut="?" aria-label="Keyboard shortcuts" onClick={() => setShortcutsOpen(true)}>
          Shortcuts <Kbd>?</Kbd>
        </Button>
        <span className="shell__user">{session.displayName}</span>
        <Button size="sm" variant="ghost" onClick={signOut}>
          Sign out
        </Button>
      </header>
      <main id="main" className="shell__main" tabIndex={-1}>
        <Outlet />
      </main>
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
