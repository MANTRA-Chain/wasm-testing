import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';

import OmSvg from '@/assets/om.svg';
import UsdcSvg from '@/assets/usdc.svg';

import { AmountInput } from './AmountInput';

const meta = {
  title: 'Example/AmountInput',
  component: AmountInput,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AmountInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const WithState: typeof AmountInput = (args) => {
  const [value, setValue] = useState('');
  return <AmountInput {...args} value={value} onChange={setValue} />;
};

export const WithBalance: Story = {
  args: {
    header: 'You will pay',
    denom: 'USDC',
    icon: <img src={UsdcSvg} />,
    balance: '2,666,664.000',
    value: '',
    onClickMax: fn(),
  },
  render: (args) => <WithState {...args} />,
};

export const WithoutBalance: Story = {
  args: {
    header: 'You will receive',
    denom: 'OM',
    icon: <img className="w-4" src={OmSvg} />,
    value: '',
    onClickMax: fn(),
  },
  render: (args) => <WithState {...args} />,
};
