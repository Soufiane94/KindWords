// A couple of wave lines gently swaying side to side near the bottom of the
// Ocean world — simple shapes, not literal water physics.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';

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

const styles = StyleSheet.create({
  wave: {
    position: 'absolute',
    left: 0,
    width: '160%',
  },
});
