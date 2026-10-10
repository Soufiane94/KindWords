// Building blocks for the still decorations around a shared picture's card
// (see WorldFrame). Each piece is a small SVG drawing placed like any
// absolutely positioned view, measured from the frame's edges so it stays
// put whatever the card's height. Turning happens on a plain View, so a
// piece always turns around its own center.

import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

// Where a piece sits in the frame, from whichever edges it's closest to.
export type FrameSpot = Pick<ViewStyle, 'top' | 'bottom' | 'left' | 'right'>;

type Props = {
  // Its spot and size.
  style: StyleProp<ViewStyle>;
  viewBox: string;
  // Degrees, clockwise.
  rotate?: number;
  // Stretch the drawing to fill the box instead of keeping its shape (to
  // slim a leaf down, or run a wave across the whole picture).
  stretch?: boolean;
  children: React.ReactNode;
};

export default function FramePiece({ style, viewBox, rotate, stretch = false, children }: Props) {
  return (
    <View style={[styles.piece, style, rotate ? { transform: [{ rotate: `${rotate}deg` }] } : null]}>
      <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio={stretch ? 'none' : 'xMidYMid meet'}>
        {children}
      </Svg>
    </View>
  );
}

// A soft round glow fading out from its middle: firelight, a lit window,
// a low sun.
export function FrameGlow({ style, color, opacity }: { style: StyleProp<ViewStyle>; color: string; opacity: number }) {
  return (
    <FramePiece style={style} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#glow)" />
    </FramePiece>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
});
