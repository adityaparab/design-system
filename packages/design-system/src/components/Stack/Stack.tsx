import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cx } from '../../utils/cx';

export type SpaceToken = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;

export interface StackProps {
  children: ReactNode;
  /** Vertical (stack) or horizontal (inline) flow. */
  direction?: 'column' | 'row';
  gap?: SpaceToken;
  padding?: SpaceToken;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  /** Grow to fill the parent flex container. */
  grow?: boolean;
  as?: ElementType;
  className?: string;
}

/**
 * Layout primitive. Remotes compose screens from Stack + tokens instead of
 * shipping their own CSS, which keeps micro frontends free of global styles.
 */
export function Stack({
  children,
  direction = 'column',
  gap = 3,
  padding,
  align,
  justify,
  wrap = false,
  grow = false,
  as: Component = 'div',
  className,
}: StackProps) {
  const style: CSSProperties = {
    flexDirection: direction,
    gap: `var(--vds-space-${gap})`,
    padding: padding === undefined ? undefined : `var(--vds-space-${padding})`,
    alignItems: align === 'start' || align === 'end' ? `flex-${align}` : align,
    justifyContent: justify === 'between' ? 'space-between' : justify === 'start' || justify === 'end' ? `flex-${justify}` : justify,
    flexWrap: wrap ? 'wrap' : undefined,
  };
  return (
    <Component className={cx('vds-stack', grow && 'vds-stack--grow', className)} style={style}>
      {children}
    </Component>
  );
}
