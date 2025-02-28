import Icon from '@/assets/dapp-template.svg';

export const AppIcon = () => {
  return (
    <div className="flex flex-row items-center gap-2">
      <img src={Icon} alt="dapp-template" className="w-8 h-8" />
      <h3 className="font-semibold text-2xl">dapp-template</h3>
    </div>
  );
};
