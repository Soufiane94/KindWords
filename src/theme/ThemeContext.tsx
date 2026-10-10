// Makes the user's chosen world (Phase 5C: colors + fonts + background +
// card style + decorations) available to every screen and component, and
// handles loading/saving which one they picked. Most components only ever
// read `colors`, so they don't need to know worlds exist at all.
//
// Since 9C it also carries two things that change how a world is drawn:
// the "plain font" setting, and the phone's own "remove animations"
// (reduce motion) setting, which keeps world decorations still.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { WORLDS, WORLD_OPTIONS, DEFAULT_WORLD_ID, WorldId, World, Palette } from '../data/worlds';
import {
  getPlainFont,
  getWorldId,
  setPlainFont as persistPlainFont,
  setWorldId as persistWorldId,
} from '../services/storage';
import { withPlainFont } from './fontStyle';

type ThemeContextValue = {
  worldId: WorldId;
  // The chosen world, with its fonts left out when "plain font" is on.
  world: World;
  colors: Palette;
  // Both setters resolve once the choice is saved, so the widget (which
  // reads storage) can be redrawn right after.
  setWorldId: (id: WorldId) => Promise<void>;
  plainFont: boolean;
  setPlainFont: (on: boolean) => Promise<void>;
  reduceMotion: boolean;
};

const defaultWorld = WORLDS[DEFAULT_WORLD_ID];

const ThemeContext = createContext<ThemeContextValue>({
  worldId: DEFAULT_WORLD_ID,
  world: defaultWorld,
  colors: defaultWorld.colors,
  setWorldId: async () => {},
  plainFont: false,
  setPlainFont: async () => {},
  reduceMotion: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [worldId, setWorldIdState] = useState<WorldId>(DEFAULT_WORLD_ID);
  const [plainFont, setPlainFontState] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    getWorldId().then(setWorldIdState);
    getPlainFont().then(setPlainFontState);
  }, []);

  // Follows the phone's setting live, so turning animations off in the
  // system settings stills the decorations without restarting the app.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  function setWorldId(id: WorldId): Promise<void> {
    setWorldIdState(id);
    return persistWorldId(id);
  }

  function setPlainFont(on: boolean): Promise<void> {
    setPlainFontState(on);
    return persistPlainFont(on);
  }

  // Memoized so screens that build their styles from `world` only rebuild
  // them when something about it actually changes.
  const world = useMemo(
    () => (plainFont ? withPlainFont(WORLDS[worldId]) : WORLDS[worldId]),
    [worldId, plainFont]
  );

  return (
    <ThemeContext.Provider
      value={{ worldId, world, colors: world.colors, setWorldId, plainFont, setPlainFont, reduceMotion }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export { WORLD_OPTIONS };
export type { WorldId, World, Palette };
