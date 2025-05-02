import { MantraProvider } from '@mantrachain/connect';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useMemo } from 'react';

import { AwaitingTransactionDialog } from '@/components/common/AwaitingTransactionDialog';
import { Navbar } from '@/components/common/Navbar';
import { useAwaitingTransactionDialog } from '@/hooks/useAwaitingTransactionDialog';
import { useChainName } from '@/hooks/useChainName';
import { Dialog } from '@/shadcn/components/ui/dialog';
import { Toaster } from '@/shadcn/components/ui/toaster';
import { useToast } from '@/shadcn/hooks/use-toast';

const WALLET_CONNECT_OPTIONS = {
  signClient: {
    projectId: '85c30f9b79cfd167f2c526fd0d5ab731',
    relayUrl: 'wss://relay.walletconnect.org',
    metadata: {
      name: 'dapp-template',
      description: 'dapp-template',
      url: 'https://mantra.zone/',
      icons: [
        'https://raw.githubusercontent.com/cosmology-tech/cosmos-kit/main/packages/docs/public/favicon-96x96.png',
      ],
    },
  },
};

function App() {
  const { toast } = useToast();

  const queryClient = useMemo(() => {
    return new QueryClient({
      mutationCache: new MutationCache({
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: error.name,
            description: error.message,
          });
        },
      }),
    });
  }, [toast]);

  const [isAwaitingTransactionDialogOpen] = useAwaitingTransactionDialog();

  const [chainName] = useChainName();

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <MantraProvider
          chainName={chainName}
          walletConnectOptions={WALLET_CONNECT_OPTIONS}
        >
          <Navbar />
          <div className="container mx-auto px-4 lg:px-6">
            <Outlet />
          </div>
          <Dialog open={isAwaitingTransactionDialogOpen}>
            <AwaitingTransactionDialog />
          </Dialog>
        </MantraProvider>
      </QueryClientProvider>
      <Toaster />
    </>
  );
}

export const Route = createRootRoute({
  component: () => (
    <>
      <App />
    </>
  ),
});
