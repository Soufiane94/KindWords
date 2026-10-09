// A value that gently oscillates between 0 and 1 forever — the shared
// pulse behind every world's small ambient animations (twinkling stars,
// swaying leaves, flickering candles). useNativeDriver means once the
// loop starts, it runs on the native side rather than the JS thread.

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function useLoopingValue(durationMs: number, delayMs = 0): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [value, durationMs, delayMs]);

  return value;
}
