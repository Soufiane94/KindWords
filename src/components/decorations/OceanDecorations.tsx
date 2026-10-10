// A couple of wave lines gently swaying side to side near the bottom of the
// Ocean world — simple shapes, not literal water physics.
// OceanFrame: the same waves along the bottom of a shared picture, still,
// and a few bubbles rising along its sides.

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import FramePiece, { FrameSpot } from './FramePiece';

type WaveSpec = { bottom: number; color: string; opacity: number; duration: number; delay: number };

const WAVES: WaveSpec[] = [
  { bottom: 56, color: '#BFE0E6', opacity: 0.5, duration: 4200, delay: 0 },
  { bottom: 20, color: '#A9D6DE', opacity: 0.6, duration: 3600, delay: 400 },
];

const WAVE_PATH = 'M-20 20 Q 5 0 30 20 T 80 20 T 130 20 T 180 20 V40 H-20 Z';

function Wave({ spec }: { spec: WaveSpec }) {
  const t = useLoopingValue(spec.duration, spec.delay);
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });

  return (
    <Animated.View style={[styles.wave, { bottom: spec.bottom, transform: [{ translateX }] }]}>
      <Svg width="160%" height={40} viewBox="0 0 160 40" preserveAspectRatio="none">
        <Path d={WAVE_PATH} fill={spec.color} opacity={spec.opacity} />
      </Svg>
    </Animated.View>
  );
}

export default function OceanDecorations() {
  return (
    <>
      {WAVES.map((spec, i) => (
        <Wave key={i} spec={spec} />
      ))}
    </>
  );
}

const FRAME_BUBBLES: (FrameSpot & { size: number })[] = [
  { left: 8, bottom: '34%', size: 10 },
  { left: 16, bottom: '48%', size: 6 },
  { left: 7, bottom: '60%', size: 7.5 },
  { right: 10, top: '18%', size: 9 },
  { right: 5, top: '31%', size: 6 },
  { right: 14, top: '42%', size: 4.5 },
];

export function OceanFrame() {
  return (
    <>
      {FRAME_BUBBLES.map(({ size, ...spot }, i) => (
        <View key={i} style={[styles.bubble, spot, { width: size, height: size, borderRadius: size / 2 }]} />
      ))}
      <FramePiece style={{ left: '-6%', bottom: 9, width: '112%', height: 24 }} viewBox="0 0 160 40" stretch>
        <Path d={WAVE_PATH} fill="#BFE0E6" opacity={0.85} />
      </FramePiece>
      <FramePiece style={{ left: '-14%', bottom: 0, width: '118%', height: 20 }} viewBox="0 0 160 40" stretch>
        <Path d={WAVE_PATH} fill="#A9D6DE" opacity={0.9} />
      </FramePiece>
    </>
  );
}

const styles = StyleSheet.create({
  wave: {
    position: 'absolute',
    left: 0,
    width: '160%',
  },
  bubble: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#5E9FAD',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    opacity: 0.85,
  },
});
