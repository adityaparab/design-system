import type { ReactNode } from 'react';
import { TENANTS, type TenantId } from './generated/tenants';
import { cx } from './utils/cx';

export { TENANTS, type TenantId };

/** Points the token cascade at a tenant theme. Works on any element, not just <html>. */
export function applyTenant(tenant: TenantId, element: HTMLElement = document.documentElement) {
  element.dataset.tenant = tenant;
}

export interface ThemeScopeProps {
  tenant: TenantId;
  children: ReactNode;
  className?: string;
}

/** Scopes a subtree to a tenant theme, e.g. for side-by-side previews or Storybook. */
export function ThemeScope({ tenant, children, className }: ThemeScopeProps) {
  return (
    <div data-tenant={tenant} className={cx('vds-root', className)}>
      {children}
    </div>
  );
}
