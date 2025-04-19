import { useMantra } from '@mantrachain/connect';

import { useAllBalances } from '@/hooks/useAllBalances';
import { Card } from '@/shadcn/components/ui/card';
import { Skeleton } from '@/shadcn/components/ui/skeleton';

import { NotConnected } from '../common/NotConnected';

const LoadingCard = () => {
  return (
    <Card className="relative flex flex-col items-center justify-center gap-3 overflow-clip w-full h-[200px]">
      <Skeleton className="w-full h-full rounded-md opacity-20" />
    </Card>
  );
};

export const UserContainer = () => {
  const { address } = useMantra();
  const { data } = useAllBalances();

  if (!address) {
    return <NotConnected />;
  }

  if (!data) {
    return <LoadingCard />;
  }

  return (
    <Card className="container relative flex flex-col items-center justify-center gap-3 overflow-clip w-full h-[200px]">
      <div className="text-base-muted-foreground">OM Balance</div>
      <div className="text-3xl text-base-card-foreground font-semibold">
        {data.om.displayAmount}
      </div>
    </Card>
  );
};
