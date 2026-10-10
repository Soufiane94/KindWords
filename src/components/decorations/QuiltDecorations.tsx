// Two small stitched-square patches in opposite corners for the Patchwork
// Quilt world, like the corner of a handmade quilt — dashed outlines,
// breathing very slowly so it reads as soft rather than busy.
// QuiltFrame: a stitched seam all around a shared picture, with a patch
// in each corner.

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Rect, Line, Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import FramePiece, { FrameSpot } from './FramePiece';

function Patch({ style, color }: { style: object; color: string }) {
  const t = useLoopingValue(3600);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] });

  return (
    <Animated.View style={[style, { opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 60 60">
        <Rect x="4" y="4" width="52" height="52" rx="4" fill="none" stroke={color} strokeWidth={2} strokeDasharray="6 5" />
        <Line x1="4" y1="30" x2="56" y2="30" stroke={color} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
        <Line x1="30" y1="4" x2="30" y2="56" stroke={color} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
      </Svg>
    </Animated.View>
  );
}

export default function QuiltDecorations() {
  return (
    <>
      <Patch style={styles.topLeft} color="#C98A96" />
      <Patch style={styles.bottomRight} color="#B5667A" />
    </>
  );
}

// Half-square-triangle patches (a classic quilt block), drawn for the
// top-left corner with the colored half facing out, and turned to fit
// the other corners.
const FRAME_PATCHES: (FrameSpot & { rotate: number; color: string })[] = [
  { left: 2, top: 2, rotate: 0, color: '#E3B7BF' },
  { right: 2, top: 2, rotate: 90, color: '#CFDCC0' },
  { right: 2, bottom: 2, rotate: 180, color: '#E3B7BF' },
  { left: 2, bottom: 2, rotate: 270, color: '#F0D9A7' },
];

export function QuiltFrame() {
  return (
    <>
      <View style={styles.seam} />
      {FRAME_PATCHES.map(({ rotate, color, ...spot }, i) => (
        <FramePiece key={i} style={[spot, styles.framePatch]} rotate={rotate} viewBox="0 0 24 24">
          <Path d="M0 0 H24 L0 24 Z" fill={color} />
          <Path d="M24 0 V24 H0 Z" fill="#FBF1E4" />
          <Rect
            x="2.5"
            y="2.5"
            width="19"
            height="19"
            fill="none"
            stroke="#B5667A"
            strokeWidth={1}
            strokeDasharray="3 2.5"
            opacity={0.55}
          />
        </FramePiece>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  // A dashed seam running all the way around, inside the picture's edge.
  seam: {
    position: 'absolute',
    top: 9,
    left: 9,
    right: 9,
    bottom: 9,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C98A96',
    borderRadius: 8,
    opacity: 0.75,
  },
  framePatch: {
    width: 24,
    height: 24,
  },
  topLeft: {
    position: 'absolute',
    top: '4%',
    left: '6%',
    width: 50,
    height: 50,
  },
  bottomRight: {
    position: 'absolute',
    bottom: '5%',
    right: '7%',
    width: 44,
    height: 44,
  },
});
