import type { Meta, StoryObj } from '@storybook/react';

import { Card } from '@/shadcn/components/ui/card';

import { HighlightedTabList } from './HighlightedTabList';

const meta = {
  title: 'Example/HighlightedTabList',
  component: HighlightedTabList,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof HighlightedTabList>;

export default meta;
type Story = StoryObj<typeof meta>;

enum UserTabsEnum {
  Balance = 'Balance',
  Deposit = 'Deposit',
  Withdraw = 'Withdraw',
}

export const Default: Story = {
  args: {
    defaultValue: UserTabsEnum.Balance,
    tabs: [
      {
        key: UserTabsEnum.Balance,
        title: 'Balance',
      },
      {
        key: UserTabsEnum.Deposit,
        title: 'Deposit',
      },
      {
        key: UserTabsEnum.Withdraw,
        title: 'Withdraw',
      },
    ],
    renderTabContent: (tabData) => {
      return (
        <Card className="flex h-[200px] items-center justify-center">
          {tabData.title}
        </Card>
      );
    },
  },
};
