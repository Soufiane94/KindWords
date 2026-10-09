// A handful of leaves drifting in from the corners for the Nature world.
// Simple pointed-oval shapes (not real botanical illustrations) kept at
// low opacity so they never compete with the quote text on top.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';

const LEAF_PATH = 'M0 25 Q12 0 25 0 Q38 0 50 25 Q38 50 25 50 Q12 50 0 25 Z';
const VEIN_PATH = 'M3 25 Q25 16 47 25';

type Pct = `${number}%`;

type LeafSpec = {
  top: Pct;
  left?: Pct;
  right?: Pct;
  size: number;
  rotate: number;
  sway: number;
  color: string;
  vein: string;
  duration: number;
  delay: number;
};

const LEAVES: LeafSpec[] = [
  { top: '2%', left: '-6%', size: 70, rotate: 20, sway: 5, color: '#8FBF7A', vein: '#6B9A56', duration: 4200, delay: 0 },
  { top: '6%', right: '-8%', size: 60, rotate: -35, sway: 4, color: '#7AAE68', vein: '#5C8C4A', duration: 3800, delay: 400 },
  { top: '82%', left: '-8%', size: 80, rotate: -15, sway: 6, color: '#A3C98F', vein: '#7AAE68', duration: 4600, delay: 200 },
  { top: '78%', right: '-6%', size: 65, rotate: 150, sway: 5, color: '#8FBF7A', vein: '#6B9A56', duration: 4000, delay: 600 },
];

function Leaf({ spec }: { spec: LeafSpec }) {
  const t = useLoopingValue(spec.duration, spec.delay);
  const rotate = t.interpolate({
    inputRange: [0, 1],
    outputRange: [`${spec.rotate - spec.sway}deg`, `${spec.rotate + spec.sway}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.leaf,
        {
          top: spec.top,
          left: spec.left,
          right: spec.right,
          width: spec.size,
          height: spec.size,
          transform: [{ rotate }],
        },
      ]}
    >
      <Svg width={spec.size} height={spec.size} viewBox="0 0 50 50">
        <Path d={LEAF_PATH} fill={spec.color} opacity={0.55} />
        <Path d={VEIN_PATH} stroke={spec.vein} strokeWidth={1.5} fill="none" opacity={0.5} />
      </Svg>
    </Animated.View>
  );
}

export default function NatureDecorations() {
  return (
    <>
      {LEAVES.map((spec, i) => (
        <Leaf key={i} spec={spec} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
  },
});
