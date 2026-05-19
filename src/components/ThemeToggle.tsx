import { MoonIcon, SunIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { IconButton } from '@/components/ui/icon-controls';

type Theme = 'dark' | 'light';

const storageKey = 'theme';

const isTheme = (value: null | string): value is Theme =>
  value === 'dark' || value === 'light';

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(storageKey);
  if (isTheme(stored)) {
    return stored;
  }
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset['kbTheme'] = theme;
  localStorage.setItem(storageKey, theme);
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <IconButton
      aria-label="Промени тема"
      onClick={() => {
        setTheme((currentTheme) =>
          currentTheme === 'dark' ? 'light' : 'dark',
        );
      }}
    >
      {theme === 'dark' ? (
        <SunIcon aria-hidden="true" />
      ) : (
        <MoonIcon aria-hidden="true" />
      )}
    </IconButton>
  );
};

export { ThemeToggle };
