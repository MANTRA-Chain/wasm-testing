import type { Meta, StoryObj } from '@storybook/react';

import { PriceString } from './PriceString';

const meta = {
  title: 'Example/PriceString',
  component: PriceString,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    amount: { control: 'text' },
    state: {
      control: 'select',
      options: ['default', 'warning', 'positive', 'negative'],
    },
    prefix: { control: 'text' },
    suffix: { control: 'text' },
    symbol: { control: 'text' },
  },
} satisfies Meta<typeof PriceString>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default state
export const Default: Story = {
  args: {
    amount: '123.456',
    state: 'default',
  },
};

// Positive state
export const Positive: Story = {
  args: {
    amount: '123.456',
    state: 'positive',
  },
};

// Negative state
export const Negative: Story = {
  args: {
    amount: '123.456',
    state: 'negative',
  },
};

// Warning state
export const Warning: Story = {
  args: {
    amount: '123.456',
    state: 'warning',
  },
};

// With Symbol
export const WithSymbol: Story = {
  args: {
    amount: '123.456',
    state: 'default',
    symbol: '$',
  },
};

// With Prefix
export const WithPrefix: Story = {
  args: {
    amount: '123.456',
    state: 'default',
    prefix: '+',
  },
};

// With Suffix
export const WithSuffix: Story = {
  args: {
    amount: '123.456',
    state: 'default',
    suffix: 'USD',
  },
};

// With All Props
export const CompleteExample: Story = {
  args: {
    amount: '1234.567890',
    state: 'positive',
    symbol: '$',
    prefix: '+',
    suffix: 'USD',
  },
};

// Large Number
export const LargeNumber: Story = {
  args: {
    amount: '123456789.123456',
    state: 'default',
    symbol: '$',
  },
};

// Custom Class
export const WithCustomClass: Story = {
  args: {
    amount: '123.456',
    state: 'default',
    className: 'text-2xl font-bold',
  },
};

// Showcasing different price formats
export const PriceFormats: Story = {
  args: {
    amount: '',
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <PriceString amount="0.99" state="default" symbol="$" />
      <PriceString amount="1000.00" state="positive" symbol="$" prefix="+" />
      <PriceString amount="25.50" state="negative" symbol="$" prefix="-" />
      <PriceString amount="3499.99" state="warning" symbol="€" />
      <PriceString amount="1.00" state="default" suffix="BTC" />
    </div>
  ),
};
