import { Card } from '@/shadcn/components/ui/card';
import { Skeleton } from '@/shadcn/components/ui/skeleton';

export const LoadingCard = () => {
  return (
    <Card className="w-[350px] h-[360px] flex flex-col items-center gap-6 py-6 my-3">
      <Skeleton className="w-[300px] h-[24px]" />
      <Skeleton className="w-[300px] h-[80px]" />
    </Card>
  );
};
