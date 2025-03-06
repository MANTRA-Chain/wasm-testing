import { Card } from '@/shadcn/components/ui/card';

import { ConnectWalletButton } from './ConnectWalletButton';

export const NotConnected = () => {
  return (
    <Card className="p-10 flex flex-col gap-0 dark:bg-transparent">
      <div className="text-3xl font-semibold mb-2">Not connected</div>
      <div className="text-base mb-10">
        Looks like you haven’t connected your wallet yet.
      </div>
      <div className="self-center">
        <ConnectWalletButton />
      </div>
    </Card>
  );
};
