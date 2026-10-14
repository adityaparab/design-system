import type { Meta, StoryObj } from '@storybook/react-vite';
import { Panel } from '../Panel/Panel';
import { StateMessage } from '../StateMessage/StateMessage';
import { SplitLayout } from './SplitLayout';
import { splitLayoutMeta } from './SplitLayout.meta';

const meta = {
  title: 'Layout/SplitLayout',
  component: SplitLayout,
  parameters: { docs: { description: { component: splitLayoutMeta.description } } },
} satisfies Meta<typeof SplitLayout>;

export default meta;

const panes = {
  start: (
    <Panel title="Document" fill>
      <StateMessage tone="info" title="Primary pane">
        <p>Flexes to fill the remaining width.</p>
      </StateMessage>
    </Panel>
  ),
  end: (
    <Panel title="Coding" fill>
      <StateMessage tone="info" title="Fixed pane">
        <p>340px wide until the container drops below 760px.</p>
      </StateMessage>
    </Panel>
  ),
};

/** Resize the canvas: the panes stack based on the container's width, not the viewport's. */
export const Default: StoryObj<typeof meta> = {
  args: panes,
  render: (args) => (
    <div style={{ height: 420, resize: 'horizontal', overflow: 'auto', border: '1px dashed var(--vds-color-border-strong)', padding: 8 }}>
      <SplitLayout {...args} />
    </div>
  ),
};
