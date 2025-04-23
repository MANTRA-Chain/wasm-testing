import { useMantra } from '@mantrachain/connect';

import { useAllBalances } from '@/hooks/useAllBalances';
import {
  useCounter,
  useIncrementMutation,
  useResetCounter,
} from '@/hooks/useCounter';
import { Button } from '@/shadcn/components/ui/button';
import { Card } from '@/shadcn/components/ui/card';
import { Skeleton } from '@/shadcn/components/ui/skeleton';

import { NotConnected } from './common/NotConnected';

const LoadingCard = () => {
  return (
    <Card className="w-full h-[200px] py-0">
      <Skeleton className="w-full h-full rounded-md opacity-20" />
    </Card>
  );
};

export const MainContainer = () => {
  const { address } = useMantra();
  const { data } = useAllBalances();
  const { data: counterData } = useCounter();
  const { mutate: incrementCounter } = useIncrementMutation();
  const { mutate: resetCounter } = useResetCounter();

  if (!address) {
    return <NotConnected />;
  }

  if (!data) {
    return <LoadingCard />;
  }

  return (
    <Card className="container relative flex flex-col items-center justify-center gap-3 overflow-clip w-full">
      <div className="text-base-muted-foreground">OM Balance</div>
      <div className="text-3xl text-base-card-foreground font-semibold">
        {data.om.displayAmount}
      </div>
      <div>Current Counter value:</div>
      <div>{counterData?.count}</div>
      <Button onClick={() => incrementCounter()}>Increment value</Button>
      <Button onClick={() => resetCounter({ to: 0 })}>Reset value</Button>
    </Card>
  );
};
