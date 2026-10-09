// Makes the user's chosen world (Phase 5C: colors + fonts + background +
// card style + decorations) available to every screen and component, and
// handles loading/saving which one they picked. Most components only ever
// read `colors`, so they don't need to know worlds exist at all.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WORLDS, WORLD_OPTIONS, DEFAULT_WORLD_ID, WorldId, World, Palette } from '../data/worlds';
import { getWorldId, setWorldId as persistWorldId } from '../services/storage';

type ThemeContextValue = {
  worldId: WorldId;
  world: World;
  colors: Palette;
  setWorldId: (id: WorldId) => void;
};

const defaultWorld = WORLDS[DEFAULT_WORLD_ID];

const ThemeContext = createContext<ThemeContextValue>({
  worldId: DEFAULT_WORLD_ID,
  world: defaultWorld,
  colors: defaultWorld.colors,
  setWorldId: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [worldId, setWorldIdState] = useState<WorldId>(DEFAULT_WORLD_ID);

  useEffect(() => {
    getWorldId().then(setWorldIdState);
  }, []);

  function setWorldId(id: WorldId) {
    setWorldIdState(id);
    persistWorldId(id);
  }

  const world = WORLDS[worldId];

  return (
    <ThemeContext.Provider value={{ worldId, world, colors: world.colors, setWorldId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export { WORLD_OPTIONS };
export type { WorldId, World, Palette };
