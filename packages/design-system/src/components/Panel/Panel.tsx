import { useId, type ReactNode } from 'react';
import { cx } from '../../utils/cx';

export interface PanelProps {
  title: string;
  children: ReactNode;
  /** Actions shown at the right of the header. */
  actions?: ReactNode;
  /** Heading level for the title; keep the document outline valid. */
  headingLevel?: 2 | 3;
  /** Remove body padding, e.g. for an edge-to-edge DataGrid. */
  flush?: boolean;
  /** Fill the height of a flex/grid parent; the body scrolls. */
  fill?: boolean;
  className?: string;
}

/** Titled surface. Renders a labelled <section>, so each panel is a navigable region. */
export function Panel({ title, children, actions, headingLevel = 2, flush = false, fill = false, className }: PanelProps) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <section className={cx('vds-panel', fill && 'vds-panel--fill', className)} aria-labelledby={headingId}>
      <header className="vds-panel__header">
        <Heading id={headingId} className="vds-panel__title">
          {title}
        </Heading>
        {actions ? <div className="vds-panel__actions">{actions}</div> : null}
      </header>
      <div className={cx('vds-panel__body', flush && 'vds-panel__body--flush')}>{children}</div>
    </section>
  );
}
