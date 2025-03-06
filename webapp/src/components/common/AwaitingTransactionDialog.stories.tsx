import type { Meta, StoryObj } from '@storybook/react';

import { Dialog } from '@/shadcn/components/ui/dialog';

import { AwaitingTransactionDialog } from './AwaitingTransactionDialog';

const meta = {
  title: 'Example/AwaitingTransactionDialog',
  component: AwaitingTransactionDialog,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AwaitingTransactionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => {
    return (
      <Dialog open>
        <AwaitingTransactionDialog />
      </Dialog>
    );
  },
};
