// Snow drifting straight down and one warm glow in a corner — a lit window
// — so Winter reads as hushed and cozy rather than cold.
// WinterFrame: still snowflakes around a shared picture's card, two snowy
// pines, and the same warm glow.

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Path, Rect } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import { useDriftingValue } from './useDriftingValue';
import FramePiece, { FrameGlow, FrameSpot } from './FramePiece';

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

// A snowflake in a 20x20 box: six arms, each with a small V near its tip.
const SNOWFLAKE_PATH = [
  'M10 10 L19 10 M15.6 10 L17.7 7.9 M15.6 10 L17.7 12.1',
  'M10 10 L14.5 17.8 M12.8 14.8 L15.7 15.6 M12.8 14.8 L12 17.7',
  'M10 10 L5.5 17.8 M7.2 14.8 L8 17.7 M7.2 14.8 L4.3 15.6',
  'M10 10 L1 10 M4.4 10 L2.3 12.1 M4.4 10 L2.3 7.9',
  'M10 10 L5.5 2.2 M7.2 5.2 L4.3 4.4 M7.2 5.2 L8 2.3',
  'M10 10 L14.5 2.2 M12.8 5.2 L12 2.3 M12.8 5.2 L15.7 4.4',
].join(' ');

const FRAME_FLAKES: (FrameSpot & { size: number })[] = [
  { left: 6, top: 10, size: 15 },
  { right: 9, top: '30%', size: 12 },
  { left: 10, top: '52%', size: 10 },
  { right: 64, top: 7, size: 11 },
];

const FRAME_SNOW: (FrameSpot & { size: number })[] = [
  { left: 60, top: 14, size: 4 },
  { left: 130, top: 8, size: 3 },
  { right: 110, top: 18, size: 3.5 },
  { left: 16, top: '36%', size: 3.5 },
  { right: 14, top: '46%', size: 4 },
  { left: 8, top: '70%', size: 3 },
];

export function WinterFrame() {
  return (
    <>
      <FrameGlow style={styles.frameGlow} color="#F3C98A" opacity={0.65} />
      {FRAME_FLAKES.map(({ size, ...spot }, i) => (
        <FramePiece key={`flake${i}`} style={[spot, { width: size, height: size }]} viewBox="0 0 20 20">
          <Path
            d={SNOWFLAKE_PATH}
            stroke="#9DB7C7"
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />
        </FramePiece>
      ))}
      {/* Snow is white like the sky here, so each dot gets a faint outline. */}
      {FRAME_SNOW.map(({ size, ...spot }, i) => (
        <View key={`snow${i}`} style={[styles.snow, spot, { width: size, height: size, borderRadius: size / 2 }]} />
      ))}
      {/* Two snowy pines at the bottom left. */}
      <FramePiece style={{ left: 2, bottom: 4, width: 40, height: 40 }} viewBox="0 0 40 40">
        <Path d="M12 4 L20 18 L16 18 L23 30 L1 30 L8 18 L4 18 Z" fill="#A9C1D0" opacity={0.75} />
        <Rect x="10.5" y="30" width="3" height="5" fill="#8BA3B3" opacity={0.75} />
        <Path d="M30 14 L36 25 L33 25 L38 33 L22 33 L27 25 L24 25 Z" fill="#BFD2DD" opacity={0.75} />
        <Rect x="28.8" y="33" width="2.4" height="4" fill="#8BA3B3" opacity={0.6} />
      </FramePiece>
    </>
  );
}

const styles = StyleSheet.create({
  flake: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#FFFFFF',
  },
  // The lit window's warm light, from the picture's bottom-right corner.
  frameGlow: {
    right: -60,
    bottom: -60,
    width: 150,
    height: 150,
  },
  snow: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#C9DCE6',
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
