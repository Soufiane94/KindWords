// A value that gently oscillates between 0 and 1 forever — the shared
// pulse behind every world's small ambient animations (twinkling stars,
// swaying leaves, flickering candles). useNativeDriver means once the
// loop starts, it runs on the native side rather than the JS thread.
//
// When the phone's "remove animations" setting is on (9C), the value just
// rests at `restAt` instead, so the decoration stays still. Every world's
// decorations go through this hook or useDriftingValue, which is what
// keeps them all respecting that setting.

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export function useLoopingValue(durationMs: number, delayMs = 0, restAt = 0.5): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  const { reduceMotion } = useTheme();

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(restAt);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(value, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: durationMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value, durationMs, delayMs, restAt, reduceMotion]);

  return value;
}
