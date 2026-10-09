// Two flickering candle flames in the top corners for the Medieval world.
// A soft glow plus two overlapping flame shapes, each corner flickering at
// a slightly different speed so they never look perfectly in sync.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';

type Pct = `${number}%`;

type Flame = { top: Pct; left?: Pct; right?: Pct; size: number; duration: number };

const FLAMES: Flame[] = [
  { top: '2%', left: '5%', size: 40, duration: 850 },
  { top: '2%', right: '5%', size: 36, duration: 1050 },
];

function FlameIcon({ flame }: { flame: Flame }) {
  const t = useLoopingValue(flame.duration);
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Animated.View
      style={[
        styles.flame,
        {
          top: flame.top,
          left: flame.left,
          right: flame.right,
          width: flame.size,
          height: flame.size * 1.3,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 30 40">
        <Ellipse cx="15" cy="27" rx="14" ry="16" fill="#F6C453" opacity={0.2} />
        <Path
          d="M15 0 C22 12 26 20 26 27 C26 34 21 40 15 40 C9 40 4 34 4 27 C4 20 8 12 15 0 Z"
          fill="#D9792E"
        />
        <Path
          d="M15 10 C19 18 21 23 21 27 C21 32 18 36 15 36 C12 36 9 32 9 27 C9 23 11 18 15 10 Z"
          fill="#F6C453"
        />
      </Svg>
    </Animated.View>
  );
}

export default function MedievalDecorations() {
  return (
    <>
      {FLAMES.map((flame, i) => (
        <FlameIcon key={i} flame={flame} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  flame: {
    position: 'absolute',
  },
});
