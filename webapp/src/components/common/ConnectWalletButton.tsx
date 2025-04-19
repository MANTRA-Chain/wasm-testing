// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '@interchain-ui/react/styles';
import { useMantra } from '@mantrachain/connect';
import { LogOut, Copy } from 'lucide-react';

import { useAllBalances } from '@/hooks/useAllBalances';
import { Button } from '@/shadcn/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu';
import { Skeleton } from '@/shadcn/components/ui/skeleton';
import { useToast } from '@/shadcn/hooks/use-toast';
import { shortenAddress } from '@/utils/shortenAddress';

const ConnectedDropdownMenu = () => {
  const { toast } = useToast();
  const { disconnect, address } = useMantra();

  const { data: balances } = useAllBalances();

  if (!address) {
    throw new Error('Address not exist');
  }

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      variant: 'success',
      title: 'Wallet address copied',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{shortenAddress(address)}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-4">
        <DropdownMenuLabel>Balances</DropdownMenuLabel>
        {balances ? (
          <>
            <DropdownMenuItem className="flex flex-row justify-between w-[180px] font-mono text-xs">
              <div>OM: </div>
              <div>{balances.om.displayAmount}</div>
            </DropdownMenuItem>
          </>
        ) : (
          <Skeleton className="w-[80px] h-[20px]" />
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={copyWalletAddress}
        >
          <Copy />
          <span>Copy wallet address</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={disconnect}>
          <LogOut />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const ConnectWalletButton = () => {
  const { connect, address } = useMantra();

  if (!address) {
    return (
      <Button variant="primary" className="" onClick={connect}>
        Connect Wallet
      </Button>
    );
  }

  return <ConnectedDropdownMenu />;
};
