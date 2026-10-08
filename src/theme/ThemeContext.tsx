// Makes the user's chosen color palette available to every screen and
// component, and handles loading/saving which one they picked.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEMES, THEME_OPTIONS, DEFAULT_THEME_NAME, ThemeName, Palette } from '../data/themes';
import { getThemeName, setThemeName as persistThemeName } from '../services/storage';

type ThemeContextValue = {
  themeName: ThemeName;
  colors: Palette;
  setThemeName: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  themeName: DEFAULT_THEME_NAME,
  colors: THEMES[DEFAULT_THEME_NAME],
  setThemeName: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>(DEFAULT_THEME_NAME);

  useEffect(() => {
    getThemeName().then(setThemeNameState);
  }, []);

  function setThemeName(name: ThemeName) {
    setThemeNameState(name);
    persistThemeName(name);
  }

  return (
    <ThemeContext.Provider value={{ themeName, colors: THEMES[themeName], setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export { THEME_OPTIONS };
export type { ThemeName, Palette };
