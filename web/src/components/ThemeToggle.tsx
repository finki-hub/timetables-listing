import { MoonIcon, SunIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { IconButton } from '@/components/ui/icon-controls';

type Theme = 'dark' | 'light';

const storageKey = 'theme';
const darkQuery = '(prefers-color-scheme: dark)';

const isTheme = (value: null | string): value is Theme =>
  value === 'dark' || value === 'light';

const readStoredTheme = (): null | Theme => {
  try {
    const stored = localStorage.getItem(storageKey);

    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
};

const systemTheme = (): Theme =>
  matchMedia(darkQuery).matches ? 'dark' : 'light';

const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(
    () => readStoredTheme() ?? systemTheme(),
  );

  useEffect(() => {
    document.documentElement.dataset['kbTheme'] = theme;
  }, [theme]);

  useEffect(() => {
    const media = matchMedia(darkQuery);
    const handleChange = () => {
      if (readStoredTheme() === null) {
        setTheme(systemTheme());
      }
    };

    media.addEventListener('change', handleChange);

    return () => {
      media.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <IconButton
      aria-label={
        theme === 'dark' ? 'Префрли на светла тема' : 'Префрли на темна тема'
      }
      onClick={() => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';

        setTheme(nextTheme);
        try {
          localStorage.setItem(storageKey, nextTheme);
        } catch {
          // Storage can be unavailable; the theme then lasts for this visit.
        }
      }}
    >
      {theme === 'dark' ? (
        <SunIcon
          aria-hidden="true"
          className="h-4 w-4"
        />
      ) : (
        <MoonIcon
          aria-hidden="true"
          className="h-4 w-4"
        />
      )}
    </IconButton>
  );
};

export { ThemeToggle };
