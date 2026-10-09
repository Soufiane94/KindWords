// A few cherry blossom petals drifting down for the Japanese Garden world —
// slower and sparser than Nature's leaves, to keep this world feeling calm
// and uncluttered.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';

const PETAL_PATH = 'M10 0 C16 4 16 12 10 18 C4 12 4 4 10 0 Z';

type Pct = `${number}%`;

type PetalSpec = { top: Pct; left: Pct; size: number; rotate: number; duration: number; delay: number };

const PETALS: PetalSpec[] = [
  { top: '4%', left: '15%', size: 22, rotate: 20, duration: 5200, delay: 0 },
  { top: '10%', left: '80%', size: 18, rotate: -30, duration: 4800, delay: 600 },
  { top: '70%', left: '88%', size: 20, rotate: 60, duration: 5600, delay: 300 },
];

function Petal({ spec }: { spec: PetalSpec }) {
  const t = useLoopingValue(spec.duration, spec.delay);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const rotate = t.interpolate({
    inputRange: [0, 1],
    outputRange: [`${spec.rotate}deg`, `${spec.rotate + 18}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.petal,
        { top: spec.top, left: spec.left, width: spec.size, height: spec.size, transform: [{ translateY }, { rotate }] },
      ]}
    >
      <Svg width={spec.size} height={spec.size} viewBox="0 0 20 18">
        <Path d={PETAL_PATH} fill="#E6A8BB" opacity={0.6} />
      </Svg>
    </Animated.View>
  );
}

export default function GardenDecorations() {
  return (
    <>
      {PETALS.map((spec, i) => (
        <Petal key={i} spec={spec} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  petal: {
    position: 'absolute',
  },
});
