// A few cherry blossom petals drifting down for the Japanese Garden world —
// slower and sparser than Nature's leaves, to keep this world feeling calm
// and uncluttered.
// GardenFrame: a blossoming branch reaching in along the top of a shared
// picture, and a few still petals around its card.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import FramePiece, { FrameSpot } from './FramePiece';

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

// A five-petal blossom centered on (x, y): the same petal, turned five
// times around the middle.
function Blossom({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <Path
          key={angle}
          d={PETAL_PATH}
          fill="#E6A8BB"
          opacity={0.85}
          transform={`rotate(${angle}) translate(-10 -18)`}
        />
      ))}
      <Circle r="3.1" fill="#C9708A" opacity={0.7} />
    </G>
  );
}

const FRAME_PETALS: (FrameSpot & { rotate: number })[] = [
  { right: 8, top: '40%', rotate: 30 },
  { right: 14, top: '63%', rotate: -25 },
  { left: 64, bottom: 8, rotate: 70 },
  { left: 9, bottom: '26%', rotate: 110 },
  { right: 60, bottom: 12, rotate: 15 },
];

export function GardenFrame() {
  return (
    <>
      {/* A cherry blossom branch reaching in along the top. */}
      <FramePiece style={{ left: -4, top: 0, width: 176, height: 36 }} viewBox="0 0 176 36">
        <Path
          d="M0 8 C30 10 62 22 100 19 C126 17 148 21 172 28"
          fill="none"
          stroke="#8A6E63"
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.55}
        />
        <Path
          d="M64 19 C72 10 82 7 94 5"
          fill="none"
          stroke="#8A6E63"
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.5}
        />
        <Blossom x={36} y={13} scale={0.62} />
        <Blossom x={102} y={19} scale={0.7} />
        <Blossom x={156} y={25} scale={0.55} />
        <Circle cx="94" cy="5" r="2.6" fill="#E6A8BB" />
        <Circle cx="128" cy="17" r="2.2" fill="#E6A8BB" opacity={0.8} />
      </FramePiece>
      {FRAME_PETALS.map(({ rotate, ...spot }, i) => (
        <FramePiece key={i} style={[spot, styles.framePetal]} rotate={rotate} viewBox="0 0 20 18">
          <Path d={PETAL_PATH} fill="#E6A8BB" opacity={0.75} />
        </FramePiece>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  petal: {
    position: 'absolute',
  },
  framePetal: {
    width: 10,
    height: 9,
  },
});
