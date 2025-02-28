import type { Meta, StoryObj } from '@storybook/react';

import { NotConnected } from './NotConnected';

const meta = {
  title: 'Example/NotConnected',
  component: NotConnected,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NotConnected>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
