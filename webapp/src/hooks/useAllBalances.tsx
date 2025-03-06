import { useMantra, useStargateClients } from '@mantrachain/connect';
import { useQuery } from '@tanstack/react-query';

import { formatTokenBalance } from '@/utils/formatTokenBalance';

const OM_DENOM = 'uom';

export const useAllBalances = () => {
  const { address } = useMantra();
  const { stargateClient } = useStargateClients();

  return useQuery({
    queryKey: ['getAllBalances', stargateClient, address],
    queryFn: async () => {
      if (!address || !stargateClient) {
        throw Error('Address is required to get all balances');
      }
      return await stargateClient.getAllBalances(address);
    },
    enabled: !!address && !!stargateClient,
    select: (data) => {
      const omAmount =
        data?.find((coin) => coin.denom === OM_DENOM)?.amount ?? '0';

      return {
        om: {
          denom: OM_DENOM,
          amount: omAmount,
          displayAmount: formatTokenBalance(omAmount),
          humanAmount: formatTokenBalance(omAmount).replace(',', ''),
        },
      };
    },
  });
};
