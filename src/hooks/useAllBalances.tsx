import { useGetAllBalances, useMantra } from '@mantrachain/connect';
import { useQuery } from '@tanstack/react-query';

import { formatTokenBalance } from '@/utils/formatTokenBalance';

const OM_DENOM = 'uom';

export const useAllBalances = () => {
  const { address } = useMantra();
  const { getAllBalances } = useGetAllBalances();

  return useQuery({
    queryKey: ['getAllBalances', address],
    queryFn: async () => {
      return await getAllBalances();
    },
    enabled: !!address,
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
