import { AppIcon } from './AppIcon';
import { ConnectWalletButton } from './ConnectWalletButton';
import { ModeToggle } from './ModeToggle';
import { NetworkSelector } from './NetworkSelector';

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <nav className="container mx-auto px-4 lg:px-6 flex flex-row h-14 items-center justify-between">
        <AppIcon />
        <div className="flex flex-row gap-3">
          <ModeToggle />
          <ConnectWalletButton />
          <NetworkSelector />
        </div>
      </nav>
    </header>
  );
};
