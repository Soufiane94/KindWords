// A value that climbs from 0 to 1 and snaps back to the start, forever —
// the shared motion behind decorations that drift one way (falling snow,
// drifting clouds, rising light), as opposed to useLoopingValue's back-
// and-forth sway (which would look like snow falling back up).
//
// With "remove animations" on (9C), it rests at `restAt` instead. Pieces
// that drift give each one a different resting point, so they stay spread
// out over the screen rather than lined up at the same spot.

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export function useDriftingValue(durationMs: number, delayMs = 0, restAt = 0.5): Animated.Value {
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
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value, durationMs, delayMs, restAt, reduceMotion]);

  return value;
}
