// A few warm sparkles and a small crescent moon for the Storybook world —
// like fairy-light dust catching the light of a bedtime story.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';

const SPARKLE_PATH = 'M9 0 L11 7 L18 9 L11 11 L9 18 L7 11 L0 9 L7 7 Z';
const MOON_PATH = 'M17 2 A15 15 0 1 0 17 32 A11 11 0 1 1 17 2 Z';

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
      <Svg style={styles.moon} width={34} height={34} viewBox="0 0 34 34">
        <Path d={MOON_PATH} fill="#F3E4C7" opacity={0.8} />
      </Svg>
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
});
