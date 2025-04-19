import { MantraChain } from '@mantrachain/connect';

import { useChainName } from './useChainName';

export const useAppConfig = () => {
  const [chainName] = useChainName();

  switch (chainName) {
    case MantraChain.Mainnet:
      return {
        contractAddress:
          'mantra1c4darky93xxfseg95vpvn55cul9uf5raza5qsrfzwk2pmue6xctsfpws3f',
      };
    case MantraChain.Testnet:
      return {
        contractAddress:
          'mantra1c4darky93xxfseg95vpvn55cul9uf5raza5qsrfzwk2pmue6xctsfpws3f',
      };
    default:
      throw new Error('Unsupported chain');
  }
};
