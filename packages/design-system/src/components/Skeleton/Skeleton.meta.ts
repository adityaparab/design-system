import { defineComponentMeta } from '../../meta.ts';
import type { SkeletonProps } from './Skeleton.tsx';

export const skeletonMeta = defineComponentMeta<SkeletonProps>()({
  name: 'Skeleton',
  category: 'feedback',
  description: 'Shape placeholder while data loads, e.g. unloaded rows in a virtualized DataGrid.',
  props: {
    width: { type: 'string', description: 'CSS width.', default: "'100%'" },
    height: { type: 'string', description: 'CSS height.', default: "'0.8em'" },
  },
  accessibility: ['aria-hidden; pair with a status message or aria-busy on the container.', 'Shimmer stops under prefers-reduced-motion.'],
  do: ['Match the size of the content being loaded to avoid layout shift.'],
  dont: ['Do not use for loads under ~300ms; it causes flicker.'],
  example: `<Skeleton width="60%" />`,
});
