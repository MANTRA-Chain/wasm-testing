import { cn } from '@/shadcn/lib/utils';

type Props = React.PropsWithChildren<{
  txHash: string;
  className?: string | undefined;
}>;

export const TxHashLink: React.FC<Props> = ({
  txHash,
  className,
  children,
}) => {
  return (
    <a
      href={`https://www.mintscan.io/mantra-testnet/tx/${txHash}`}
      target="_blank"
      className={cn('hover:underline', className)}
    >
      {children}
    </a>
  );
};
