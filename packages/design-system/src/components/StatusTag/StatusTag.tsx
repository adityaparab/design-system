import type { ReactNode } from 'react';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'privileged';

export interface StatusTagProps {
  children: ReactNode;
  tone?: StatusTone;
}

/** Compact status label. Colour is never the only signal: the text carries the meaning. */
export function StatusTag({ children, tone = 'neutral' }: StatusTagProps) {
  return <span className={`vds-tag vds-tag--${tone}`}>{children}</span>;
}
