import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/shadcn/components/ui/button';

enum Theme {
  Dark = 'dark',
  Light = 'light',
}

const STORAGE_KEY = 'vite-ui-theme';
const DEFAULT_THEME = Theme.Dark;

export function ModeToggle() {
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem(STORAGE_KEY) as Theme) || DEFAULT_THEME,
  );
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === Theme.Dark ? Theme.Light : Theme.Dark;
    localStorage.setItem(STORAGE_KEY, newTheme);
    setTheme(newTheme);
  };

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
