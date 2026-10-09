// A value that climbs from 0 to 1 and snaps back to the start, forever —
// the shared motion behind decorations that drift one way (falling snow,
// drifting clouds, rising light), as opposed to useLoopingValue's back-
// and-forth sway (which would look like snow falling back up).

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function useDriftingValue(durationMs: number, delayMs = 0): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(value, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value, durationMs, delayMs]);

  return value;
}
