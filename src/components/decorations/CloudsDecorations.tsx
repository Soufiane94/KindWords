// A couple of soft cloud shapes drifting sideways for the Soft Clouds
// world — plain overlapping ellipses, kept very light so the screen stays
// calm and uncluttered.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { useDriftingValue } from './useDriftingValue';

type Pct = `${number}%`;
type CloudSpec = { top: Pct; size: number; opacity: number; duration: number; delay: number; reverse?: boolean };

const CLOUDS: CloudSpec[] = [
  { top: '10%', size: 90, opacity: 0.5, duration: 26000, delay: 0 },
  { top: '70%', size: 70, opacity: 0.4, duration: 32000, delay: 4000, reverse: true },
];

function Cloud({ spec }: { spec: CloudSpec }) {
  const t = useDriftingValue(spec.duration, spec.delay);
  const translateX = t.interpolate({
    inputRange: [0, 1],
    outputRange: spec.reverse ? [400, -400] : [-400, 400],
  });

  return (
    <Animated.View
      style={[styles.cloud, { top: spec.top, width: spec.size, height: spec.size * 0.6, transform: [{ translateX }] }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 90 54">
        <Ellipse cx="30" cy="34" rx="28" ry="18" fill="#FFFFFF" opacity={spec.opacity} />
        <Ellipse cx="55" cy="26" rx="22" ry="16" fill="#FFFFFF" opacity={spec.opacity} />
        <Ellipse cx="42" cy="20" rx="18" ry="14" fill="#FFFFFF" opacity={spec.opacity} />
      </Svg>
    </Animated.View>
  );
}

export default function CloudsDecorations() {
  return (
    <>
      {CLOUDS.map((spec, i) => (
        <Cloud key={i} spec={spec} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  cloud: {
    position: 'absolute',
  },
});
