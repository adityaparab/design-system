/**
 * Component metadata: the single source for Storybook descriptions, the generated
 * manifest.json and the design-system MCP server.
 *
 * `PropDocs<P>` is a mapped type over the component's real props interface, so the
 * typechecker fails if a prop is added without documentation or a documented prop
 * no longer exists.
 */
export interface PropDoc {
  type: string;
  description: string;
  required?: boolean;
  default?: string;
}

export type PropDocs<P> = { [K in keyof Required<P>]: PropDoc };

export type ComponentCategory = 'actions' | 'data-display' | 'forms' | 'feedback' | 'layout' | 'overlay';

export interface ComponentMeta<P> {
  name: string;
  category: ComponentCategory;
  description: string;
  /** PrimeReact module wrapped, if any. */
  wraps?: string;
  props: PropDocs<P>;
  accessibility: string[];
  do: string[];
  dont: string[];
  example: string;
}

export const defineComponentMeta =
  <P>() =>
  (meta: ComponentMeta<P>): ComponentMeta<P> =>
    meta;
