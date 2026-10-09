// A small wax-seal medallion and a couple of faint ink flourishes for the
// Letters & Ink world — mostly still, like something already written and
// waiting to be read, with the seal catching a little light.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLoopingValue } from './useLoopingValue';

function WaxSeal() {
  const t = useLoopingValue(2800);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0.95] });

  return (
    <Animated.View style={[styles.seal, { opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 40 40">
        <Circle cx="20" cy="20" r="18" fill="#A8392E" />
        <Circle cx="20" cy="20" r="18" fill="none" stroke="#7A281F" strokeWidth={1.5} />
        <Path d="M12 22 Q20 10 28 22 Q20 18 12 22 Z" fill="#C97A6E" opacity={0.6} />
      </Svg>
    </Animated.View>
  );
}

const FLOURISH_PATH = 'M0 10 Q 15 0 30 10 Q 45 20 60 10';

export default function LettersDecorations() {
  return (
    <>
      <WaxSeal />
      <Svg style={styles.flourishTop} width={120} height={20} viewBox="0 0 60 20">
        <Path d={FLOURISH_PATH} stroke="#C9B48A" strokeWidth={1.2} fill="none" opacity={0.5} />
      </Svg>
      <Svg style={styles.flourishBottom} width={120} height={20} viewBox="0 0 60 20">
        <Path d={FLOURISH_PATH} stroke="#C9B48A" strokeWidth={1.2} fill="none" opacity={0.4} />
      </Svg>
    </>
  );
}

const styles = StyleSheet.create({
  seal: {
    position: 'absolute',
    top: '8%',
    right: '10%',
    width: 40,
    height: 40,
  },
  flourishTop: {
    position: 'absolute',
    top: '4%',
    left: '8%',
  },
  flourishBottom: {
    position: 'absolute',
    bottom: '6%',
    right: '12%',
    transform: [{ rotate: '180deg' }],
  },
});
