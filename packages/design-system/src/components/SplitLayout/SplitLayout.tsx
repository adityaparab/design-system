import type { CSSProperties, ReactNode } from 'react';
import type { SpaceToken } from '../Stack/Stack';

export interface SplitLayoutProps {
  start: ReactNode;
  end: ReactNode;
  /** Which pane keeps a fixed width; the other one flexes. */
  fixedPane?: 'start' | 'end';
  /** CSS width of the fixed pane, e.g. "340px" or "clamp(420px, 40%, 620px)". */
  fixedWidth?: string;
  gap?: SpaceToken;
  /**
   * Stack the panes when the *container* (not the viewport) is narrower than
   * sm 600px, md 760px or lg 960px. Micro frontends rarely know how wide their slot is.
   */
  collapseBelow?: 'sm' | 'md' | 'lg';
}

/** Two-pane layout driven by container queries. */
export function SplitLayout({ start, end, fixedPane = 'end', fixedWidth = '340px', gap = 3, collapseBelow = 'md' }: SplitLayoutProps) {
  const style = {
    '--vds-split-columns': fixedPane === 'start' ? `${fixedWidth} minmax(0, 1fr)` : `minmax(0, 1fr) ${fixedWidth}`,
    '--vds-split-gap': `var(--vds-space-${gap})`,
  } as CSSProperties;
  return (
    <div className={`vds-split vds-split--collapse-${collapseBelow}`}>
      <div className="vds-split__inner" style={style}>
        <div className="vds-split__pane">{start}</div>
        <div className="vds-split__pane">{end}</div>
      </div>
    </div>
  );
}
