// A firelight glow in one corner and a few rain streaks in the other, for
// the Cozy Cabin world — warmth inside, weather outside.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Ellipse, Line } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';

function FireGlow() {
  const t = useLoopingValue(1400);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] });

  return (
    <Animated.View style={[styles.glow, { opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Ellipse cx="100" cy="100" rx="100" ry="100" fill="#E08A3C" />
      </Svg>
    </Animated.View>
  );
}

type Drop = { top: number; left: number; delay: number };

const DROPS: Drop[] = [
  { top: 10, left: 70, delay: 0 },
  { top: 30, left: 85, delay: 500 },
  { top: 15, left: 100, delay: 900 },
];

function RainStreak({ drop }: { drop: Drop }) {
  const t = useLoopingValue(2000, drop.delay);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] });

  return (
    <Animated.View style={[styles.drop, { top: drop.top, left: drop.left, opacity }]}>
      <Svg width={2} height={28}>
        <Line x1="1" y1="0" x2="1" y2="28" stroke="#BFD4E0" strokeWidth={2} />
      </Svg>
    </Animated.View>
  );
}

export default function CabinDecorations() {
  return (
    <>
      <FireGlow />
      {DROPS.map((drop, i) => (
        <RainStreak key={i} drop={drop} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
  },
  drop: {
    position: 'absolute',
  },
});
