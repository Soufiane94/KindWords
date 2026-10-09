// A scatter of twinkling stars for the Space world. Fixed fake-random
// positions (not actually random) so they don't jump around on every
// re-render — plain circles, no need for SVG here.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useLoopingValue } from './useLoopingValue';

type Pct = `${number}%`;

type Star = { top: Pct; left: Pct; size: number; duration: number; delay: number };

const STARS: Star[] = [
  { top: '8%', left: '12%', size: 3, duration: 1800, delay: 0 },
  { top: '14%', left: '72%', size: 2, duration: 2200, delay: 300 },
  { top: '20%', left: '45%', size: 2.5, duration: 2600, delay: 600 },
  { top: '26%', left: '88%', size: 3, duration: 1900, delay: 900 },
  { top: '32%', left: '20%', size: 2, duration: 2400, delay: 200 },
  { top: '40%', left: '60%', size: 3.5, duration: 2100, delay: 1200 },
  { top: '48%', left: '8%', size: 2, duration: 2500, delay: 500 },
  { top: '55%', left: '82%', size: 2.5, duration: 1900, delay: 800 },
  { top: '62%', left: '35%', size: 2, duration: 2300, delay: 1100 },
  { top: '68%', left: '68%', size: 3, duration: 2000, delay: 1400 },
  { top: '74%', left: '15%', size: 2.5, duration: 2600, delay: 300 },
  { top: '80%', left: '50%', size: 2, duration: 1800, delay: 1000 },
  { top: '86%', left: '90%', size: 3, duration: 2200, delay: 700 },
  { top: '12%', left: '30%', size: 2, duration: 2000, delay: 1500 },
];

function StarDot({ star }: { star: Star }) {
  const t = useLoopingValue(star.duration, star.delay);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.9] });

  return (
    <Animated.View
      style={[
        styles.star,
        {
          top: star.top,
          left: star.left,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          opacity,
        },
      ]}
    />
  );
}

export default function SpaceDecorations() {
  return (
    <>
      {STARS.map((star, i) => (
        <StarDot key={i} star={star} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
});
