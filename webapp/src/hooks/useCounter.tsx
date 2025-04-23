import {
  useCosmWasmClients,
  useMantra,
  useWalletClient,
} from '@mantrachain/connect';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  DappTemplateClient,
  DappTemplateQueryClient,
} from '@/__generated__/contracts/DappTemplate.client';
import { DappTemplateMsgComposer } from '@/__generated__/contracts/DappTemplate.message-composer';
import { TxHashLink } from '@/components/common/TxHashLink';
import { useToast } from '@/shadcn/hooks/use-toast';

import { useAppConfig } from './useAppConfig';
import { useAwaitingTransactionDialog } from './useAwaitingTransactionDialog';
import { useCalculateGasFee } from './useCalculateGasFee';

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

      console.log(client);
      return client.getCount();
    },
  });
};

export const useCounterIncrement = () => {
  const { address } = useMantra();
  const { contractAddress } = useAppConfig();
  const { signingCosmWasmClient, cosmWasmClient } = useCosmWasmClients();

  const callIncrement = useCallback(async () => {
    const queryClient = new QueryClient();

    if (!signingCosmWasmClient) {
      throw 'SigningCosmWasmClient not found!';
    }

    if (!address) {
      throw 'Address not found!';
    }

    const client = new DappTemplateClient(
      signingCosmWasmClient,
      address,
      contractAddress,
    );
    try {
      await client.increment();
      alert('Counter successfully updated');
      queryClient.invalidateQueries({
        queryKey: ['useCounter', cosmWasmClient],
      });
    } catch (e) {
      alert(e);
    }
  }, [address, contractAddress, signingCosmWasmClient, cosmWasmClient]);

  return { callIncrement };
};

export const useIncrementMutation = () => {
  const [, setOpen] = useAwaitingTransactionDialog();
  const { toast: t } = useToast();
  const { contractAddress } = useAppConfig();
  const { address: walletAddress } = useMantra();
  const { signingCosmWasmClient } = useCosmWasmClients();
  const { client: walletClient } = useWalletClient();
  const { calculateGasFee } = useCalculateGasFee();
  const { refetch: refetchCounterValue } = useCounter();

  return useMutation({
    mutationFn: async () => {
      if (!walletAddress) {
        throw new Error('walletAddress not found!');
      }
      if (!walletClient) {
        throw new Error('walletClient not found!');
      }
      if (!signingCosmWasmClient) {
        throw new Error('signingCosmWasmClient not found');
      }
      setOpen(true);

      const incrementMessage = new DappTemplateMsgComposer(
        walletAddress,
        contractAddress,
      ).increment();

      const messages = [incrementMessage];

      const fee = await calculateGasFee(messages);

      const result = await signingCosmWasmClient.signAndBroadcast(
        walletAddress,
        messages,
        fee,
        '',
      );

      return result;
    },
    onSuccess: (data) => {
      setOpen(false);
      refetchCounterValue();
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

export const useResetCounter = () => {
  const { address } = useMantra();
  const { signingCosmWasmClient } = useCosmWasmClients();
  const { client: walletClient } = useWalletClient();
  const { contractAddress } = useAppConfig();
  const [, setOpen] = useAwaitingTransactionDialog();
  const { toast } = useToast();
  const { refetch: refetchCounterValue } = useCounter();
  return useMutation({
    mutationFn: async ({ to = 0 }: { to: number }) => {
      if (!address) {
        throw new Error('Address not found');
      }
      if (!walletClient) {
        throw new Error('walletClient not found!');
      }
      if (!signingCosmWasmClient) {
        throw new Error('signingCosmWasmClient not found');
      }
      setOpen(true);
      const message = new DappTemplateMsgComposer(
        address,
        contractAddress,
      ).reset({
        count: to,
      });

      const res = await signingCosmWasmClient.signAndBroadcast(
        address,
        [message],
        'auto',
      );

      return res;
    },
    onSuccess: (data) => {
      refetchCounterValue();
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
