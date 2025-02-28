import { AppIcon } from './AppIcon';
import { ConnectWalletButton } from './ConnectWalletButton';
import { NetworkSelector } from './NetworkSelector';

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background bg-zinc-950">
      <nav className="flex flex-row h-14 items-center justify-between px-4 container">
        <AppIcon />
        <div className="flex flex-row gap-3">
          <ConnectWalletButton />
          <NetworkSelector />
        </div>
      </nav>
    </header>
  );
};
