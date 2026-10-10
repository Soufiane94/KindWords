// A firelight glow in one corner and a few rain streaks in the other, for
// the Cozy Cabin world — warmth inside, weather outside.
// CabinFrame: the same firelight and rain around a shared picture's card,
// still, with a few embers rising from the fire.

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Line } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import { FrameGlow, FrameSpot } from './FramePiece';

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

const FRAME_EMBERS: (FrameSpot & { size: number; opacity: number })[] = [
  { left: 12, bottom: 64, size: 3, opacity: 0.8 },
  { left: 20, bottom: 90, size: 2, opacity: 0.6 },
  { left: 9, bottom: 112, size: 2.4, opacity: 0.5 },
];

const FRAME_RAIN: (FrameSpot & { length: number; opacity: number })[] = [
  { right: 10, top: 10, length: 18, opacity: 0.5 },
  { right: 19, top: 38, length: 14, opacity: 0.4 },
  { right: 7, top: 60, length: 20, opacity: 0.45 },
  { right: 44, top: 5, length: 12, opacity: 0.35 },
  { right: 74, top: 11, length: 13, opacity: 0.3 },
  { right: 15, top: 92, length: 12, opacity: 0.3 },
];

export function CabinFrame() {
  return (
    <>
      <FrameGlow style={styles.frameGlow} color="#E08A3C" opacity={0.6} />
      {FRAME_EMBERS.map(({ size, opacity, ...spot }, i) => (
        <View
          key={`ember${i}`}
          style={[styles.ember, spot, { width: size, height: size, borderRadius: size / 2, opacity }]}
        />
      ))}
      {FRAME_RAIN.map(({ length, opacity, ...spot }, i) => (
        <View key={`rain${i}`} style={[styles.streak, spot, { height: length, opacity }]} />
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
  // Centered on the picture's bottom-left corner.
  frameGlow: {
    left: -80,
    bottom: -80,
    width: 190,
    height: 190,
  },
  ember: {
    position: 'absolute',
    backgroundColor: '#F2A65A',
  },
  streak: {
    position: 'absolute',
    width: 1.6,
    borderRadius: 1,
    backgroundColor: '#BFD4E0',
    transform: [{ rotate: '12deg' }],
  },
});
