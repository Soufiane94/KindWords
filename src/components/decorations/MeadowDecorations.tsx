// A warm glowing sun and a few light motes drifting slowly upward for the
// Sunrise Meadow world — the opposite direction from falling snow or
// leaves, so it reads as light rising rather than things falling.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import { useDriftingValue } from './useDriftingValue';

function SunGlow() {
  const t = useLoopingValue(3400);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.65] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Animated.View style={[styles.sun, { opacity, transform: [{ scale }] }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#F7C873" />
      </Svg>
    </Animated.View>
  );
}

type Pct = `${number}%`;
type MoteSpec = { left: Pct; size: number; duration: number; delay: number };

const MOTES: MoteSpec[] = [
  { left: '20%', size: 5, duration: 6200, delay: 0 },
  { left: '48%', size: 4, duration: 5400, delay: 1500 },
  { left: '75%', size: 6, duration: 6800, delay: 700 },
];

function Mote({ spec }: { spec: MoteSpec }) {
  const t = useDriftingValue(spec.duration, spec.delay);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [500, -20] });
  const opacity = t.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.7, 0.7, 0] });

  return (
    <Animated.View
      style={[
        styles.mote,
        { left: spec.left, width: spec.size, height: spec.size, borderRadius: spec.size / 2, opacity, transform: [{ translateY }] },
      ]}
    />
  );
}

export default function MeadowDecorations() {
  return (
    <>
      <SunGlow />
      {MOTES.map((spec, i) => (
        <Mote key={i} spec={spec} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  sun: {
    position: 'absolute',
    top: '6%',
    left: '10%',
    width: 60,
    height: 60,
  },
  mote: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#FDEBC4',
  },
});
