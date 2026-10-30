// Wafi says hello on the last step of the welcome (9O). Wrap the welcome
// card in it: the pup hops onto the middle of the card's top edge, looks
// up, blinks, then breaks into a big smile with a little hop. With the
// phone's "remove animations" setting on (9C) it's simply there, smiling,
// still. Purely decorative, like Mascot: screen readers skip it, and the
// card says the words.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import MascotDrawing, { MascotFace, mascotPeek } from './MascotDrawing';

// In points: how wide the pup is drawn, how far above its spot it lands
// from, and how high its happy hop goes.
const WIDTH = 168;
const LANDING_HEIGHT = 28;
const HOP_HEIGHT = 12;

// The hello, in milliseconds from the start: each face change, and the
// big smile last, which the hop goes with.
const BLINK_AT = 1100;
const BLINK_MS = 160;
const SMILE_AT = 1700;

type Props = {
  // The welcome card.
  children: React.ReactNode;
};

export default function MascotWelcome({ children }: Props) {
  const { reduceMotion } = useTheme();
  const [face, setFace] = useState<MascotFace>(reduceMotion ? 'joy' : 'smile');
  const landing = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const hop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      setFace('joy');
      landing.setValue(1);
      return;
    }
    Animated.timing(landing, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    }).start();
    const timers = [
      setTimeout(() => setFace('blink'), BLINK_AT),
      setTimeout(() => setFace('smile'), BLINK_AT + BLINK_MS),
      setTimeout(() => {
        setFace('joy');
        Animated.sequence([
          Animated.timing(hop, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(hop, { toValue: 0, duration: 380, easing: Easing.bounce, useNativeDriver: true }),
        ]).start();
      }, SMILE_AT),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion, landing, hop]);

  const landingY = landing.interpolate({ inputRange: [0, 1], outputRange: [-LANDING_HEIGHT, 0] });
  // Fades in over the first part of the landing only.
  const opacity = landing.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] });
  const hopY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -HOP_HEIGHT] });

  return (
    <View style={styles.area}>
      {children}
      <View
        style={styles.pup}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {/* Two layers, so the landing and the hop never fight over one value. */}
        <Animated.View style={{ opacity, transform: [{ translateY: landingY }] }}>
          <Animated.View style={{ transform: [{ translateY: hopY }] }}>
            <MascotDrawing face={face} width={WIDTH} />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Room above the card for the pup.
  area: {
    width: '100%',
    marginTop: mascotPeek(WIDTH),
  },
  // Centered on the card's top edge, its paws resting on it.
  pup: {
    position: 'absolute',
    top: -mascotPeek(WIDTH),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
