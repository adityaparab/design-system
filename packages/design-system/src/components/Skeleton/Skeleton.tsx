export interface SkeletonProps {
  width?: string;
  height?: string;
}

/** Placeholder for content that is still loading. Hidden from assistive tech; announce loading elsewhere. */
export function Skeleton({ width = '100%', height = '0.8em' }: SkeletonProps) {
  return <span className="vds-skeleton" aria-hidden="true" style={{ width, height }} />;
}
