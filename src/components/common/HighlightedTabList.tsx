import { TabsProps } from '@radix-ui/react-tabs';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shadcn/components/ui/tabs';

type TabData = {
  key: string;
  title: React.ReactNode;
};

type Props = {
  tabs: TabData[];
  renderTabContent: (tabData: TabData) => React.ReactNode;
} & TabsProps;

export const HighlightedTabList: React.FC<Props> = ({
  tabs,
  renderTabContent,
  ...tabsProps
}) => {
  return (
    <Tabs {...tabsProps}>
      <TabsList className="flex flex-row gap-0 dark:bg-transparent rounded-none px-0 h-[48px] items-stretch py-0 justify-start">
        {tabs.map((tabData) => {
          return (
            <TabsTrigger
              key={tabData.key}
              className="w-[120px] rounded-none data-[state=active]:font-semibold data-[state=active]:border-b-2 border-base-primary "
              value={tabData.key}
            >
              {tabData.title}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {tabs.map((tabData) => {
        return (
          <TabsContent className="min-h-[450px] mt-0" value={tabData.key}>
            {renderTabContent(tabData)}
          </TabsContent>
        );
      })}
    </Tabs>
  );
};
