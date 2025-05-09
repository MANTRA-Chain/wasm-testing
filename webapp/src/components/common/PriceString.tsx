import { cva } from 'class-variance-authority';

import { cn } from '@/shadcn/lib/utils';

type Props = {
  amount: string;
  state?: 'positive' | 'negative' | 'default' | 'warning';
  prefix?: string;
  suffix?: string;
  symbol?: string;
  className?: string;
};

const priceStringVariants = cva('font-mono inline-flex items-center gap-1.5', {
  variants: {
    state: {
      default: 'text-base-foreground',
      warning: 'text-base-warning',
      negative: 'text-base-destructive',
      positive: 'text-base-positive',
    },
  },
});

const fractionalVariants = cva('', {
  variants: {
    state: {
      default: 'text-base-muted-foreground',
      warning: 'text-base-warning-muted-foreground',
      negative: 'text-base-destructive-muted-foreground',
      positive: 'text-base-positive-muted-foreground',
    },
  },
});

export const PriceString: React.FC<Props> = ({
  amount,
  state = 'default',
  prefix,
  suffix,
  symbol,
  className,
}) => {
  const [integer, fraction] = amount.split('.');
  return (
    <span className={cn(className, priceStringVariants({ state }))}>
      {symbol && <span>{symbol}</span>}
      {prefix && <span>{prefix}</span>}
      <span>
        <span>{integer}</span>
        <span className={cn(fractionalVariants({ state }))}>.{fraction}</span>
      </span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
};
