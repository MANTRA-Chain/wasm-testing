import { MantraChain } from '@mantrachain/connect';

import { useChainName } from './useChainName';

export const useAppConfig = () => {
  const [chainName] = useChainName();

  switch (chainName) {
    case MantraChain.Mainnet:
      return {
        contractAddress:
          'mantra1erh2yx5ren3hswq4gvu3v7jrm7el77xt24rt2jjhjnde9t9ad0asv44pcu',
      };
    case MantraChain.Testnet:
      return {
        contractAddress:
          'mantra1erh2yx5ren3hswq4gvu3v7jrm7el77xt24rt2jjhjnde9t9ad0asv44pcu',
      };
    default:
      throw new Error('Unsupported chain');
  }
};
