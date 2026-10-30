// Makes the current world (Phase 5C: colors + fonts + background + card
// style + decorations) available to every screen and component. Most
// components only ever read `colors`, so they don't need to know worlds
// exist at all.
//
// Nobody picks a world: a new one comes by itself each day (see
// pickTodaysWorld in storage.ts), unless "A new look each day" is turned
// off, which keeps the calm Simple world.
//
// Since 9C it also carries two things that change how a world is drawn:
// the "plain font" setting, and the phone's own "remove animations"
// (reduce motion) setting, which keeps world decorations still.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { WORLDS, DEFAULT_WORLD_ID, WorldId, World, Palette } from '../data/worlds';
import {
  getDailyWorld,
  getPlainFont,
  pickTodaysWorld,
  setDailyWorld as persistDailyWorld,
  setPlainFont as persistPlainFont,
} from '../services/storage';
import { refreshKindWordWidget } from '../widget/widgetTaskHandler';
import { withPlainFont } from './fontStyle';

type ThemeContextValue = {
  worldId: WorldId;
  // Today's world, with its fonts left out when "plain font" is on.
  world: World;
  colors: Palette;
  // "A new look each day". Both setters resolve once the choice is saved,
  // so the widget (which reads storage) can be redrawn right after.
  dailyWorld: boolean;
  setDailyWorld: (on: boolean) => Promise<void>;
  plainFont: boolean;
  setPlainFont: (on: boolean) => Promise<void>;
  // Back to the defaults without saving anything, after "Delete all my
  // data" has emptied storage (9D).
  resetTheme: () => void;
  reduceMotion: boolean;
};

const defaultWorld = WORLDS[DEFAULT_WORLD_ID];

const ThemeContext = createContext<ThemeContextValue>({
  worldId: DEFAULT_WORLD_ID,
  world: defaultWorld,
  colors: defaultWorld.colors,
  dailyWorld: true,
  setDailyWorld: async () => {},
  plainFont: false,
  setPlainFont: async () => {},
  resetTheme: () => {},
  reduceMotion: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [worldId, setWorldIdState] = useState<WorldId>(DEFAULT_WORLD_ID);
  const [dailyWorld, setDailyWorldState] = useState(true);
  const [plainFont, setPlainFontState] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    getDailyWorld().then(setDailyWorldState);
    getPlainFont().then(setPlainFontState);
  }, []);

  // Checked when the app starts and each time it comes back to the front,
  // so the first look at the app on a new day finds a new world. Nothing
  // changes while it's in use.
  useEffect(() => {
    function showTodaysWorld() {
      pickTodaysWorld().then(({ worldId: id, isNew }) => {
        setWorldIdState(id);
        // The widget reads the world from storage, so it follows.
        if (isNew) refreshKindWordWidget();
      });
    }
    showTodaysWorld();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') showTodaysWorld();
    });
    return () => subscription.remove();
  }, []);

  // Follows the phone's setting live, so turning animations off in the
  // system settings stills the decorations without restarting the app.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  // Off shows Simple straight away; back on brings a world at once.
  async function setDailyWorld(on: boolean): Promise<void> {
    setDailyWorldState(on);
    await persistDailyWorld(on);
    const { worldId: id } = await pickTodaysWorld();
    setWorldIdState(id);
  }

  function setPlainFont(on: boolean): Promise<void> {
    setPlainFontState(on);
    return persistPlainFont(on);
  }

  function resetTheme() {
    setWorldIdState(DEFAULT_WORLD_ID);
    setDailyWorldState(true);
    setPlainFontState(false);
  }

  // Memoized so screens that build their styles from `world` only rebuild
  // them when something about it actually changes.
  const world = useMemo(
    () => (plainFont ? withPlainFont(WORLDS[worldId]) : WORLDS[worldId]),
    [worldId, plainFont]
  );

  return (
    <ThemeContext.Provider
      value={{
        worldId,
        world,
        colors: world.colors,
        dailyWorld,
        setDailyWorld,
        plainFont,
        setPlainFont,
        resetTheme,
        reduceMotion,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export type { WorldId, World, Palette };
