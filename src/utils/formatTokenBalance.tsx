import BigNumber from 'bignumber.js';

export const formatTokenBalance = (
  amount: string,
  decimals: number = 6,
): string => {
  if (!amount || isNaN(Number(amount))) return '0';

  const bigAmount = new BigNumber(amount).dividedBy(10 ** decimals);
  return bigAmount.toFormat(decimals);
};
