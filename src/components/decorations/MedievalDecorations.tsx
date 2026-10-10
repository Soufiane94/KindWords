// Two flickering candle flames in the top corners for the Medieval world.
// A soft glow plus two overlapping flame shapes, each corner flickering at
// a slightly different speed so they never look perfectly in sync.
// MedievalFrame: a whole candle standing on each side of a shared
// picture's card.

import React from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';
import FramePiece from './FramePiece';

// The flame, in a 30x40 box.
const FLAME_OUTER = 'M15 0 C22 12 26 20 26 27 C26 34 21 40 15 40 C9 40 4 34 4 27 C4 20 8 12 15 0 Z';
const FLAME_INNER = 'M15 10 C19 18 21 23 21 27 C21 32 18 36 15 36 C12 36 9 32 9 27 C9 23 11 18 15 10 Z';

type Pct = `${number}%`;

type Flame = { top: Pct; left?: Pct; right?: Pct; size: number; duration: number };

const FLAMES: Flame[] = [
  { top: '2%', left: '5%', size: 40, duration: 850 },
  { top: '2%', right: '5%', size: 36, duration: 1050 },
];

function FlameIcon({ flame }: { flame: Flame }) {
  const t = useLoopingValue(flame.duration);
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Animated.View
      style={[
        styles.flame,
        {
          top: flame.top,
          left: flame.left,
          right: flame.right,
          width: flame.size,
          height: flame.size * 1.3,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 30 40">
        <Ellipse cx="15" cy="27" rx="14" ry="16" fill="#F6C453" opacity={0.2} />
        <Path d={FLAME_OUTER} fill="#D9792E" />
        <Path d={FLAME_INNER} fill="#F6C453" />
      </Svg>
    </Animated.View>
  );
}

export default function MedievalDecorations() {
  return (
    <>
      {FLAMES.map((flame, i) => (
        <FlameIcon key={i} flame={flame} />
      ))}
    </>
  );
}

// A lit candle in a brass holder, drawn 30 wide: glow, flame, wick, then
// the wax (with a drip). `wax` is how tall the wax still is, so the two
// candles can have burned down by different amounts.
function Candle({ style, wax }: { style: StyleProp<ViewStyle>; wax: number }) {
  return (
    <FramePiece style={style} viewBox={`0 0 30 ${wax + 28}`}>
      <Ellipse cx="15" cy="13" rx="15" ry="16" fill="#F6C453" opacity={0.25} />
      <G transform="translate(8 0) scale(0.47)">
        <Path d={FLAME_OUTER} fill="#D9792E" />
        <Path d={FLAME_INNER} fill="#F6C453" />
      </G>
      <Line x1="15" y1="18" x2="15" y2="23" stroke="#3B2B1A" strokeWidth={1.4} />
      <Rect x="8" y="22" width="14" height={wax} rx="2" fill="#F8EDD3" stroke="#C9B48A" strokeWidth={1} />
      <Path d="M8 26 Q11 31 13 26 Q15 34 17 27" fill="none" stroke="#E6D3A8" strokeWidth={1.4} />
      <Rect x="3" y={wax + 21} width="24" height="6" rx="3" fill="#8C5A2B" opacity={0.75} />
    </FramePiece>
  );
}

const DIAMOND_PATH = 'M4 0 L8 6 L4 12 L0 6 Z';

export function MedievalFrame() {
  return (
    <>
      <Candle style={{ left: 3, bottom: 8, width: 22, height: 74 }} wax={72} />
      <Candle style={{ right: 3, bottom: 8, width: 22, height: 56 }} wax={48} />
      {/* Small diamonds in the top corners, like an old manuscript's. */}
      <FramePiece style={{ left: 10, top: 9, width: 8, height: 12 }} viewBox="0 0 8 12">
        <Path d={DIAMOND_PATH} fill="#B59A66" opacity={0.7} />
      </FramePiece>
      <FramePiece style={{ right: 10, top: 9, width: 8, height: 12 }} viewBox="0 0 8 12">
        <Path d={DIAMOND_PATH} fill="#B59A66" opacity={0.7} />
      </FramePiece>
    </>
  );
}

const styles = StyleSheet.create({
  flame: {
    position: 'absolute',
  },
});
