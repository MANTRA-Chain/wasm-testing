import { Button } from '@/shadcn/components/ui/button';
import { Card } from '@/shadcn/components/ui/card';
import { Input } from '@/shadcn/components/ui/input';

type Props = {
  header: React.ReactNode;
  denom: string;
  icon: React.ReactNode;
  balance?: string | null;
  value: string | null;
  onChange?: (value: string) => void;
  onClickMax?: () => void;
};

export const AmountInput: React.FC<Props> = ({
  header,
  denom,
  icon,
  balance,
  value,
  onChange,
  onClickMax,
}) => {
  return (
    <Card className="flex flex-col space-y-4 px-6 py-4 border-none dark:bg-base-muted">
      <div className="text-base-muted-foreground">{header}</div>
      <div className="flex flex-row items-center justify-between">
        <Button variant="outline" className="px-4 flex-shrink-0">
          {icon}
          {denom}
        </Button>
        <Input
          min={0}
          type="number"
          className="flex-grow text-right font-mono border-none dark:bg-base-muted dark:ring-offset-0 dark:focus-visible:ring-0 file:text-2xl text-2xl placeholder:text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0.00"
          value={value ?? ''}
          onChange={(e) => {
            onChange?.(e.target.value);
          }}
        />
      </div>
      {balance && (
        <div className="flex flex-row items-center justify-between">
          <div className="text-sm text-base-muted-foreground">
            Balance:{' '}
            <span className="font-mono text-sm text-base-foreground">
              {balance}
            </span>
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-sm dark:text-base-primary"
            onClick={onClickMax}
          >
            Max
          </Button>
        </div>
      )}
    </Card>
  );
};
