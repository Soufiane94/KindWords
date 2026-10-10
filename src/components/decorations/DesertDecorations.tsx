// A low sun glow and two still dune silhouettes for the Desert world — the
// sun breathes gently, the dunes stay fixed, so the scene reads as calm,
// wide-open space rather than something busy.
// DesertFrame: a sun setting behind two dunes along the bottom of a shared
// picture, and a couple of distant birds.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import FramePiece from './FramePiece';

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

// Unlike the screen's dunes, these slope all the way down at both ends, so
// no straight edge shows where one stops in the middle of the picture.
const FRAME_DUNE_BACK = 'M0 60 Q30 30 62 22 Q84 16 100 24 L100 60 Z';
const FRAME_DUNE_FRONT = 'M0 18 Q22 2 48 16 Q74 30 100 60 L0 60 Z';

export function DesertFrame() {
  return (
    <>
      <FramePiece style={{ right: -8, bottom: 18, width: 54, height: 54 }} viewBox="0 0 48 48">
        <Circle cx="24" cy="24" r="23" fill="#F8C99E" opacity={0.55} />
        <Circle cx="24" cy="24" r="14" fill="#EE9A5C" opacity={0.6} />
      </FramePiece>
      <FramePiece style={{ right: 0, bottom: 0, width: '66%', height: 40 }} viewBox="0 0 100 60" stretch>
        <Path d={FRAME_DUNE_BACK} fill="#D9AE80" opacity={0.65} />
      </FramePiece>
      <FramePiece style={{ left: 0, bottom: 0, width: '70%', height: 48 }} viewBox="0 0 100 60" stretch>
        <Path d={FRAME_DUNE_FRONT} fill="#E8C7A3" opacity={0.8} />
      </FramePiece>
      <FramePiece style={{ left: 8, top: 8, width: 36, height: 16 }} viewBox="0 0 30 14">
        <Path
          d="M2 6 Q5 2 8 6 Q11 2 14 6"
          fill="none"
          stroke="#8A6A4E"
          strokeWidth={1.3}
          strokeLinecap="round"
          opacity={0.7}
        />
        <Path
          d="M16 11 Q18.5 8 21 11 Q23.5 8 26 11"
          fill="none"
          stroke="#8A6A4E"
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.5}
        />
      </FramePiece>
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
