import { MantraChain } from '@mantrachain/connect';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const chainNameAtom = atomWithStorage<string>('chainName', MantraChain.Testnet);

export const useChainName = () => {
  return useAtom(chainNameAtom);
};
