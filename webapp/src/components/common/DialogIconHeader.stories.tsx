import type { Meta, StoryObj } from '@storybook/react';
import { CircleCheckBig } from 'lucide-react';

import { DialogIconHeader } from './DialogIconHeader';

const meta = {
  title: 'Example/DialogIconHeader',
  component: DialogIconHeader,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DialogIconHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <CircleCheckBig className="w-16 h-16" />,
    title: 'Deposit successful',
  },
};
