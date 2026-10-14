import type { ReactNode } from 'react';

export interface StateMessageProps {
  tone: 'empty' | 'error' | 'info' | 'loading';
  title: string;
  children?: ReactNode;
  /** Recovery action, e.g. a retry button. */
  action?: ReactNode;
}

/**
 * Empty, error and loading states. Errors use role="alert" so they are announced;
 * other tones use role="status".
 */
export function StateMessage({ tone, title, children, action }: StateMessageProps) {
  return (
    <div className={`vds-state vds-state--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <p className="vds-state__title">{title}</p>
      {children ? <div className="vds-state__body">{children}</div> : null}
      {action ? <div className="vds-state__action">{action}</div> : null}
    </div>
  );
}
