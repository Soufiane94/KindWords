// Snow drifting straight down and one warm glow in a corner — a lit window
// — so Winter reads as hushed and cozy rather than cold.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useLoopingValue } from './useLoopingValue';
import { useDriftingValue } from './useDriftingValue';

type Pct = `${number}%`;
type FlakeSpec = { left: Pct; size: number; duration: number; delay: number };

const FLAKES: FlakeSpec[] = [
  { left: '12%', size: 5, duration: 6200, delay: 0 },
  { left: '30%', size: 4, duration: 5600, delay: 1400 },
  { left: '55%', size: 6, duration: 6600, delay: 600 },
  { left: '72%', size: 4, duration: 5800, delay: 2100 },
  { left: '88%', size: 5, duration: 6400, delay: 900 },
];

function Flake({ spec }: { spec: FlakeSpec }) {
  const t = useDriftingValue(spec.duration, spec.delay);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-10, 500] });
  const opacity = t.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.8, 0.8, 0] });

  return (
    <Animated.View
      style={[
        styles.flake,
        { left: spec.left, width: spec.size, height: spec.size, borderRadius: spec.size / 2, opacity, transform: [{ translateY }] },
      ]}
    />
  );
}

function WindowGlow() {
  const t = useLoopingValue(2600);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.7] });
  return <Animated.View style={[styles.glow, { opacity }]} />;
}

export default function WinterDecorations() {
  return (
    <>
      {FLAKES.map((spec, i) => (
        <Flake key={i} spec={spec} />
      ))}
      <WindowGlow />
    </>
  );
}

const styles = StyleSheet.create({
  flake: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#FFFFFF',
  },
  glow: {
    position: 'absolute',
    top: '6%',
    right: '10%',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3D9A8',
  },
});
