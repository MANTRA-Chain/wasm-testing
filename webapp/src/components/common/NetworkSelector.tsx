import { MantraChain, useAllowedChains } from '@mantrachain/connect';

import { useChainName } from '@/hooks/useChainName';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select';

const getDisplayName = (chain: ReturnType<typeof useAllowedChains>[0]) => {
  switch (chain.chain.chain_name) {
    case MantraChain.Mainnet:
      return 'Mainnet';
    case MantraChain.Testnet:
      return 'Dukong Testnet';
    default:
      return chain.chain.pretty_name;
  }
};

export const NetworkSelector = () => {
  const [chainName, setChainName] = useChainName();
  const chains = useAllowedChains();

  const selectedChain = chains.find(
    (chain) => chain.chain.chain_name === chainName,
  );

  if (!selectedChain) {
    throw new Error("Couldn't find selected chain");
  }

  return (
    <Select value={selectedChain.chain.chain_name} onValueChange={setChainName}>
      <SelectTrigger className="w-[150px] text-left dark:focus:ring-1 dark:focus:ring-zinc-800 dark:focus:ring-offset-0">
        <SelectValue>{getDisplayName(selectedChain)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {chains.map((chain) => {
          return (
            <SelectItem
              key={chain.chain.chain_name}
              value={chain.chain.chain_name}
            >
              {getDisplayName(chain)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
