import { useCosmWasmClients, useMantra } from '@mantrachain/connect';
import { useMutation, useQuery } from '@tanstack/react-query';

import { DappTemplateQueryClient } from '@/__generated__/contracts/DappTemplate.client';
import { DappTemplateMsgComposer } from '@/__generated__/contracts/DappTemplate.message-composer';
import { TxHashLink } from '@/components/common/TxHashLink';
import { useToast } from '@/shadcn/hooks/use-toast';

import { useAllBalances } from './useAllBalances';
import { useAppConfig } from './useAppConfig';
import { useAwaitingTransactionDialog } from './useAwaitingTransactionDialog';

export const useCounter = () => {
  const { contractAddress } = useAppConfig();
  const { cosmWasmClient } = useCosmWasmClients();
  return useQuery({
    queryKey: ['useCounter', cosmWasmClient],
    queryFn: async () => {
      if (!cosmWasmClient) {
        throw 'CosmWasmClient not found!';
      }

      const client = new DappTemplateQueryClient(
        cosmWasmClient,
        contractAddress,
      );

      return client.getCount();
    },
  });
};

export const useIncrementMutation = () => {
  const [, setOpen] = useAwaitingTransactionDialog();
  const { toast: t } = useToast();
  const { contractAddress } = useAppConfig();
  const { address: walletAddress } = useMantra();
  const { signingCosmWasmClient } = useCosmWasmClients();
  const { refetch: refetchCounterValue } = useCounter();
  const { refetch: refetchAllBalances } = useAllBalances();

  return useMutation({
    mutationFn: async () => {
      if (!walletAddress) {
        throw new Error('walletAddress not found!');
      }
      if (!signingCosmWasmClient) {
        throw new Error('signingCosmWasmClient not found');
      }
      setOpen(true);

      const message = new DappTemplateMsgComposer(
        walletAddress,
        contractAddress,
      ).increment();

      const result = await signingCosmWasmClient.signAndBroadcast(
        walletAddress,
        [message],
        'auto',
      );

      return result;
    },
    onSuccess: (data) => {
      setOpen(false);
      refetchCounterValue();
      refetchAllBalances();
      t({
        duration: 10000,
        variant: 'success',
        title: 'Counter incremented!',
        description: (
          <TxHashLink
            className="underline hover:no-underline"
            txHash={data.transactionHash}
          >
            View transaction
          </TxHashLink>
        ),
      });
      return data;
    },
    onError: (error) => {
      setOpen(false);
      t({
        duration: 5000,
        variant: 'destructive',
        description: 'Error occured during increment',
      });
      console.error('Mutation failed', error);
    },
  });
};

export const useResetCounterMutation = () => {
  const { address: walletAddress } = useMantra();
  const { signingCosmWasmClient } = useCosmWasmClients();
  const { contractAddress } = useAppConfig();
  const [, setOpen] = useAwaitingTransactionDialog();
  const { toast } = useToast();
  const { refetch: refetchCounterValue } = useCounter();
  const { refetch: refetchAllBalances } = useAllBalances();

  return useMutation({
    mutationFn: async ({ to = 0 }: { to: number }) => {
      if (!walletAddress) {
        throw new Error('Address not found');
      }
      if (!signingCosmWasmClient) {
        throw new Error('signingCosmWasmClient not found');
      }
      setOpen(true);
      const message = new DappTemplateMsgComposer(
        walletAddress,
        contractAddress,
      ).reset({
        count: to,
      });

      const result = await signingCosmWasmClient.signAndBroadcast(
        walletAddress,
        [message],
        'auto',
      );

      return result;
    },
    onSuccess: (data) => {
      refetchCounterValue();
      refetchAllBalances();
      setOpen(false);
      toast({
        duration: 10000,
        variant: 'success',
        title: 'Counter value reset',
        description: (
          <TxHashLink
            className="underline hover:no-underline"
            txHash={data.transactionHash}
          >
            View transaction
          </TxHashLink>
        ),
      });
    },
    onError: () => {
      setOpen(false);
      toast({
        duration: 10000,
        variant: 'destructive',
        description: `Reset failed!`,
      });
    },
  });
};
