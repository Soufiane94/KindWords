// A warm glowing sun and a few light motes drifting slowly upward for the
// Sunrise Meadow world — the opposite direction from falling snow or
// leaves, so it reads as light rising rather than things falling.
// MeadowFrame: the low sun glowing in a corner of a shared picture, still
// light motes, and grass in the bottom corners.

import React from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import { useDriftingValue } from './useDriftingValue';
import FramePiece, { FrameGlow, FrameSpot } from './FramePiece';

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

const FRAME_MOTES: (FrameSpot & { size: number })[] = [
  { left: 12, top: '46%', size: 4 },
  { left: 19, top: '64%', size: 3 },
  { right: 10, top: '28%', size: 4.4 },
  { right: 17, top: '48%', size: 3 },
  { right: 8, top: '66%', size: 3.6 },
  { right: 90, top: 12, size: 3.4 },
];

// A tuft of grass with two small flowers, drawn for the bottom-left corner
// (and mirrored for the bottom-right one).
function GrassTuft({ style }: { style: StyleProp<ViewStyle> }) {
  return (
    <FramePiece style={style} viewBox="0 0 44 34">
      <G fill="none" stroke="#A3AC5E" strokeWidth={1.6} strokeLinecap="round" opacity={0.75}>
        <Path d="M6 34 Q8 20 2 10" />
        <Path d="M12 34 Q12 18 16 6" />
        <Path d="M18 34 Q20 22 26 14" />
        <Path d="M24 34 Q27 26 36 22" />
        <Path d="M9 34 Q4 26 0 24" />
      </G>
      <Circle cx="16" cy="6" r="2.6" fill="#F2A65A" opacity={0.85} />
      <Circle cx="26" cy="14" r="2" fill="#F7D36B" opacity={0.9} />
    </FramePiece>
  );
}

export function MeadowFrame() {
  return (
    <>
      <FrameGlow style={styles.frameSun} color="#F9C35E" opacity={0.85} />
      {FRAME_MOTES.map(({ size, ...spot }, i) => (
        <View key={i} style={[styles.frameMote, spot, { width: size, height: size, borderRadius: size / 2 }]} />
      ))}
      <GrassTuft style={styles.grassLeft} />
      <GrassTuft style={styles.grassRight} />
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
  // Centered just behind the card's top-left corner.
  frameSun: {
    left: -30,
    top: -30,
    width: 116,
    height: 116,
  },
  frameMote: {
    position: 'absolute',
    backgroundColor: '#FFF7E2',
    opacity: 0.95,
  },
  grassLeft: {
    left: 0,
    bottom: 0,
    width: 44,
    height: 34,
  },
  grassRight: {
    right: 0,
    bottom: 0,
    width: 44,
    height: 34,
    transform: [{ scaleX: -1 }],
  },
});
