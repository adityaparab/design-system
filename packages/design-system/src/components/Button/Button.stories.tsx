import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckIcon } from 'primereact/icons/check';
import { fn } from 'storybook/test';
import { Kbd } from '../Kbd/Kbd';
import { Stack } from '../Stack/Stack';
import { Button } from './Button';
import { buttonMeta } from './Button.meta';

const meta = {
  title: 'Actions/Button',
  component: Button,
  parameters: { docs: { description: { component: buttonMeta.description } } },
  args: { children: 'Save', onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = {};
export const Ghost: Story = { args: { variant: 'ghost', children: 'Skip' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Remove coding' } };
export const Loading: Story = { args: { variant: 'primary', loading: true, children: 'Saving' } };

export const AllVariants: Story = {
  render: () => (
    <Stack direction="row" gap={2} align="center" wrap>
      <Button variant="primary" icon={<CheckIcon />} keyShortcut="Control+Enter">
        Save and next
      </Button>
      <Button>Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button size="sm">Small</Button>
      <Button disabled>Disabled</Button>
      <span>
        <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>
      </span>
    </Stack>
  ),
};
