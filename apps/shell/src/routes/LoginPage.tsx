import { Button, Panel, RadioGroup, Stack, TENANTS, type TenantId } from '@verity/design-system';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { REVIEWERS, useSession } from '../platform/session';

export function LoginPage() {
  const { session, signIn } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string>(REVIEWERS[0].userId);
  const [tenant, setTenant] = useState<TenantId>('acme');

  if (session) return <Navigate to="/review" replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    signIn(userId, tenant);
    const from = (location.state as { from?: string } | null)?.from;
    void navigate(from && from !== '/login' ? `${from}${location.search}` : `/review${location.search}`, { replace: true });
  };

  return (
    <main className="shell-login" id="main">
      <form onSubmit={submit} className="shell-login__card" aria-labelledby="login-title">
        <Panel title="Sign in to Verity Review">
          <Stack gap={5}>
            <h1 id="login-title" className="vds-visually-hidden">
              Sign in
            </h1>
            <p style={{ margin: 0 }}>Demo session: no credentials. Pick a reviewer and a tenant; the tenant drives the theme.</p>
            <RadioGroup label="Reviewer" value={userId} onChange={setUserId} options={REVIEWERS.map((r) => ({ value: r.userId, label: r.displayName }))} />
            <RadioGroup label="Tenant" value={tenant} onChange={setTenant} options={TENANTS.map((t) => ({ value: t.id, label: t.name }))} />
            <Button type="submit" variant="primary">
              Continue
            </Button>
          </Stack>
        </Panel>
      </form>
    </main>
  );
}
