// Two small stitched-square patches in opposite corners for the Patchwork
// Quilt world, like the corner of a handmade quilt — dashed outlines,
// breathing very slowly so it reads as soft rather than busy.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';

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

const styles = StyleSheet.create({
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
