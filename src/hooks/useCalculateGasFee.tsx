import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { useCosmWasmClients, useMantra } from '@mantrachain/connect';
import { useCallback } from 'react';

export const useCalculateGasFee = () => {
  const { address: walletAddress } = useMantra();
  const { signingCosmWasmClient } = useCosmWasmClients();

  const calculateGasFee = useCallback(
    async (messages: MsgExecuteContractEncodeObject[]) => {
      if (!walletAddress) {
        throw new Error('walletAddress not found');
      }
      if (!signingCosmWasmClient) {
        throw new Error('signingCosmWasmClient not found');
      }

      const gasAmount = await signingCosmWasmClient.simulate(
        walletAddress,
        messages,
        undefined,
      );

      const gasResponse = await fetch(
        'https://rest.cosmos.directory/mantrachain/feemarket/v1/gas_price/uom',
      );
      const gasJson = await gasResponse.json();
      const fee = {
        gas: Math.ceil(gasAmount * 1.2).toString(),
        amount: [gasJson.price],
      };

      return fee;
    },
    [signingCosmWasmClient, walletAddress],
  );

  return { calculateGasFee };
};
