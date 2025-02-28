import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { ConnectWalletButton } from './ConnectWalletButton';

const meta = {
  title: 'Example/ConnectWalletButton',
  component: ConnectWalletButton,
  parameters: {
    layout: 'centered',
  },
  args: { onClick: fn() },
} satisfies Meta<typeof ConnectWalletButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
};
