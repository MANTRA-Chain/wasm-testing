import { LoaderCircle } from 'lucide-react';

import { DialogContent } from '@/shadcn/components/ui/dialog';

import { DialogIconHeader } from '../common/DialogIconHeader';

export const AwaitingTransactionDialog = () => {
  return (
    <DialogContent className="bg-base-card border-none rounded-3xl dark flex flex-col items-stretch gap-4 w-[576px] p-10 [&>button]:hidden">
      <DialogIconHeader
        icon={<LoaderCircle className="w-16 h-16 animate-spin" />}
        title={'Awaiting your approval'}
      />
      <div className="text-sm text-center">
        Click ‘Approve’ and go to your wallet to follow the instructions.
      </div>
    </DialogContent>
  );
};
