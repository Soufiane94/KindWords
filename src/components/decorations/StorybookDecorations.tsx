// A few warm sparkles and a small crescent moon for the Storybook world —
// like fairy-light dust catching the light of a bedtime story.
// StorybookFrame: a string of fairy lights across the top of a shared
// picture, with the same sparkles and moon, still.

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import FramePiece, { FrameSpot } from './FramePiece';

// Also Space's glints.
export const SPARKLE_PATH = 'M9 0 L11 7 L18 9 L11 11 L9 18 L7 11 L0 9 L7 7 Z';
// A crescent in a 32x32 box: most of a circle, with a smaller circle's arc
// biting into it from the upper right.
const MOON_PATH = 'M15.2 3 A14 14 0 1 0 29.4 21.2 A12 12 0 0 1 15.2 3 Z';

type Pct = `${number}%`;
type SparkleSpec = { top: Pct; left: Pct; size: number; color: string; duration: number; delay: number };

const SPARKLES: SparkleSpec[] = [
  { top: '10%', left: '20%', size: 16, color: '#E8C76B', duration: 2200, delay: 0 },
  { top: '18%', left: '68%', size: 12, color: '#C7A0DE', duration: 2600, delay: 500 },
  { top: '72%', left: '82%', size: 14, color: '#E8C76B', duration: 2400, delay: 900 },
];

function Sparkle({ spec }: { spec: SparkleSpec }) {
  const t = useLoopingValue(spec.duration, spec.delay);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.8] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.1] });

  return (
    <Animated.View
      style={[
        styles.sparkle,
        { top: spec.top, left: spec.left, width: spec.size, height: spec.size, opacity, transform: [{ scale }] },
      ]}
    >
      <Svg width={spec.size} height={spec.size} viewBox="0 0 18 18">
        <Path d={SPARKLE_PATH} fill={spec.color} />
      </Svg>
    </Animated.View>
  );
}

export default function StorybookDecorations() {
  return (
    <>
      {SPARKLES.map((spec, i) => (
        <Sparkle key={i} spec={spec} />
      ))}
      <Svg style={styles.moon} width={34} height={34} viewBox="0 0 32 32">
        <Path d={MOON_PATH} fill="#F3E4C7" opacity={0.8} />
      </Svg>
    </>
  );
}

// Bulbs along the wire: how far across the picture each one hangs, and how
// far down (the wire sags most in the middle).
const FRAME_LIGHTS: { left: `${number}%`; top: number; color: string }[] = [
  { left: '10%', top: 7.1, color: '#E8C76B' },
  { left: '22%', top: 12.7, color: '#C7A0DE' },
  { left: '36%', top: 16.7, color: '#E8C76B' },
  { left: '50%', top: 18, color: '#C7A0DE' },
  { left: '64%', top: 16.7, color: '#E8C76B' },
  { left: '78%', top: 12.7, color: '#C7A0DE' },
  { left: '90%', top: 7.1, color: '#E8C76B' },
];

const FRAME_SPARKLES: (FrameSpot & { size: number; color: string })[] = [
  { left: 8, top: '44%', size: 12, color: '#E8C76B' },
  { right: 9, top: '60%', size: 10, color: '#C7A0DE' },
  { left: 12, bottom: 12, size: 9, color: '#C7A0DE' },
];

const FRAME_DUST: (FrameSpot & { size: number })[] = [
  { left: 18, top: '62%', size: 2.4 },
  { right: 16, top: '40%', size: 2 },
  { left: 120, bottom: 10, size: 2.2 },
];

export function StorybookFrame() {
  return (
    <>
      <FramePiece style={styles.wire} viewBox="0 0 100 30" stretch>
        <Path d="M-2 5 Q50 39 102 5" fill="none" stroke="#9A8FB0" strokeWidth={1} opacity={0.5} />
      </FramePiece>
      {FRAME_LIGHTS.map(({ color, ...spot }, i) => (
        <FramePiece key={`light${i}`} style={[spot, styles.light]} viewBox="0 0 10 10">
          <Circle cx="5" cy="5" r="5" fill={color} opacity={0.3} />
          <Circle cx="5" cy="5" r="2.6" fill={color} />
        </FramePiece>
      ))}
      {FRAME_SPARKLES.map(({ size, color, ...spot }, i) => (
        <FramePiece key={`sparkle${i}`} style={[spot, { width: size, height: size }]} viewBox="0 0 18 18">
          <Path d={SPARKLE_PATH} fill={color} opacity={0.85} />
        </FramePiece>
      ))}
      {FRAME_DUST.map(({ size, ...spot }, i) => (
        <View key={`dust${i}`} style={[styles.dust, spot, { width: size, height: size, borderRadius: size / 2 }]} />
      ))}
      <FramePiece style={styles.frameMoon} viewBox="0 0 32 32">
        <Path d={MOON_PATH} fill="#E8C76B" opacity={0.8} />
      </FramePiece>
    </>
  );
}

const styles = StyleSheet.create({
  sparkle: {
    position: 'absolute',
  },
  moon: {
    position: 'absolute',
    top: '5%',
    right: '8%',
  },
  wire: {
    left: 0,
    top: 0,
    width: '100%',
    height: 30,
  },
  // Centered on its spot along the wire.
  light: {
    width: 10,
    height: 10,
    marginLeft: -5,
  },
  dust: {
    position: 'absolute',
    backgroundColor: '#E8C76B',
    opacity: 0.8,
  },
  frameMoon: {
    right: 5,
    top: 34,
    width: 20,
    height: 20,
  },
});
