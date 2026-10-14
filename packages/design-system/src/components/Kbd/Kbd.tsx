import type { ReactNode } from 'react';

export interface KbdProps {
  children: ReactNode;
}

/** Visual keyboard-shortcut hint. Pair with aria-keyshortcuts on the control it describes. */
export function Kbd({ children }: KbdProps) {
  return <kbd className="vds-kbd">{children}</kbd>;
}
