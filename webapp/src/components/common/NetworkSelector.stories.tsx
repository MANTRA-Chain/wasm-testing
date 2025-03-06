import type { Meta, StoryObj } from '@storybook/react';

import { NetworkSelector } from './NetworkSelector';

const meta = {
  title: 'Example/NetworkSelector',
  component: NetworkSelector,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NetworkSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
