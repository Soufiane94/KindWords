// A low sun glow and two still dune silhouettes for the Desert world — the
// sun breathes gently, the dunes stay fixed, so the scene reads as calm,
// wide-open space rather than something busy.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';

function SunGlow() {
  const t = useLoopingValue(3200);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View style={[styles.sun, { opacity, transform: [{ scale }] }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#F4B98A" />
      </Svg>
    </Animated.View>
  );
}

const DUNE_PATH_LEFT = 'M0 40 Q40 0 100 30 L100 60 L0 60 Z';
const DUNE_PATH_RIGHT = 'M0 30 Q60 0 100 40 L100 60 L0 60 Z';

export default function DesertDecorations() {
  return (
    <>
      <SunGlow />
      <Svg style={styles.duneLeft} width="60%" height={60} viewBox="0 0 100 60" preserveAspectRatio="none">
        <Path d={DUNE_PATH_LEFT} fill="#E8C7A3" opacity={0.5} />
      </Svg>
      <Svg style={styles.duneRight} width="55%" height={50} viewBox="0 0 100 60" preserveAspectRatio="none">
        <Path d={DUNE_PATH_RIGHT} fill="#D9AE80" opacity={0.45} />
      </Svg>
    </>
  );
}

const styles = StyleSheet.create({
  sun: {
    position: 'absolute',
    top: '10%',
    right: '12%',
    width: 70,
    height: 70,
  },
  duneLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  duneRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
