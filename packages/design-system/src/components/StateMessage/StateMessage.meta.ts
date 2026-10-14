import { defineComponentMeta } from '../../meta.ts';
import type { StateMessageProps } from './StateMessage.tsx';

export const stateMessageMeta = defineComponentMeta<StateMessageProps>()({
  name: 'StateMessage',
  category: 'feedback',
  description: 'Empty, loading, info and error states, including the fallback shown when a micro frontend fails.',
  props: {
    tone: { type: "'empty' | 'error' | 'info' | 'loading'", description: 'Kind of state.', required: true },
    title: { type: 'string', description: 'One-line summary.', required: true },
    children: { type: 'ReactNode', description: 'Explanation and next step.' },
    action: { type: 'ReactNode', description: 'Recovery action such as Retry.' },
  },
  accessibility: ['error -> role="alert" (announced immediately); other tones -> role="status" (polite).'],
  do: ['Say what happened and what the user can do next.'],
  dont: ['Do not show stack traces or internal error codes as the title.'],
  example: `<StateMessage tone="error" title="Viewer unavailable" action={<Button onClick={retry}>Retry</Button>}>The rest of the page still works.</StateMessage>`,
});
