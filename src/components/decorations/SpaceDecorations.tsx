// A scatter of twinkling stars for the Space world. Fixed fake-random
// positions (not actually random) so they don't jump around on every
// re-render — plain circles, no need for SVG here.
// SpaceFrame: still stars around a shared picture's card, with a couple
// of glints and a small ringed planet.

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Circle, Ellipse, Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import FramePiece, { FrameSpot } from './FramePiece';
import { SPARKLE_PATH } from './StorybookDecorations';

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

type FrameStar = FrameSpot & { size: number; opacity: number };

// Kept to the frame's edges, where the card doesn't cover them.
const FRAME_STARS: FrameStar[] = [
  { left: 44, top: 12, size: 2.6, opacity: 0.8 },
  { left: 102, top: 20, size: 3.2, opacity: 0.6 },
  { left: 176, top: 9, size: 2.2, opacity: 0.9 },
  { right: 74, top: 17, size: 3, opacity: 0.7 },
  { right: 128, top: 23, size: 2, opacity: 0.5 },
  { left: 11, top: '32%', size: 3, opacity: 0.8 },
  { left: 18, top: '55%', size: 2, opacity: 0.6 },
  { left: 9, top: '74%', size: 2.6, opacity: 0.7 },
  { right: 13, top: '28%', size: 2.2, opacity: 0.7 },
  { right: 8, top: '50%', size: 3.2, opacity: 0.8 },
  { right: 17, top: '68%', size: 2, opacity: 0.5 },
  { left: 76, bottom: 13, size: 2.6, opacity: 0.7 },
  { left: 156, bottom: 8, size: 2, opacity: 0.6 },
  { right: 52, bottom: 17, size: 2.8, opacity: 0.8 },
];

export function SpaceFrame() {
  return (
    <>
      {FRAME_STARS.map(({ size, opacity, ...spot }, i) => (
        <View key={i} style={[styles.star, spot, { width: size, height: size, borderRadius: size / 2, opacity }]} />
      ))}
      <FramePiece style={{ left: 7, top: 7, width: 15, height: 15 }} viewBox="0 0 18 18">
        <Path d={SPARKLE_PATH} fill="#FFFFFF" opacity={0.85} />
      </FramePiece>
      <FramePiece style={{ right: 7, bottom: '34%', width: 11, height: 11 }} viewBox="0 0 18 18">
        <Path d={SPARKLE_PATH} fill="#FFFFFF" opacity={0.7} />
      </FramePiece>
      <FramePiece style={{ left: 2, bottom: 5, width: 30, height: 20 }} viewBox="0 0 30 20">
        <Circle cx="15" cy="10" r="6.5" fill="#A98CE8" opacity={0.85} />
        <Ellipse
          cx="15"
          cy="10"
          rx="13"
          ry="3.6"
          fill="none"
          stroke="#AEB4D9"
          strokeWidth={1.2}
          opacity={0.8}
          transform="rotate(-18 15 10)"
        />
      </FramePiece>
    </>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
});
