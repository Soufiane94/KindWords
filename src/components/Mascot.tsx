// The mascot, peeking over the quote card on Home and on the Kind word
// screen. Wrap the card in it: the pup sits on the card's top edge, on the
// right, with room left for it above the card.
//
// It shows a new face each time the kind word changes: never the same one
// twice in a row, and always one that suits the kind word's mood, so a quote
// about grief never gets a big grin. A small hop goes with each new face,
// unless the phone's "remove animations" setting is on (9C). Purely
// decorative: screen readers skip it.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import MascotDrawing, { MascotFace, mascotPeek } from './MascotDrawing';

// The faces that suit each quote mood (`mood` in quotes.json). Three each,
// so there's always another one to change to. The cheerful ones (joy, perky)
// are kept for encouragement, and personal notes, which have no mood, get
// the gentle ones.
const FACES_FOR_MOOD: Record<string, MascotFace[]> = {
  comfort: ['smile', 'tender', 'peaceful'],
  gentle: ['smile', 'tender', 'peaceful'],
  warmth: ['smile', 'tender', 'peaceful'],
  encouragement: ['smile', 'joy', 'perky'],
};

// A face that suits the mood, other than the one showing now.
function pickFace(mood: string | undefined, current?: MascotFace): MascotFace {
  const suited = (mood && FACES_FOR_MOOD[mood]) || FACES_FOR_MOOD.gentle;
  const options = suited.filter((face) => face !== current);
  return options[Math.floor(Math.random() * options.length)];
}

// In points: how wide the pup is drawn, and how high it hops.
const WIDTH = 104;
const HOP_HEIGHT = 5;

type Props = {
  // What the card shows: a quote, or a personal note (no mood). A new id
  // brings a new face.
  kindWord: { id: string; mood?: string };
  // The card itself.
  children: React.ReactNode;
};

export default function Mascot({ kindWord, children }: Props) {
  const { reduceMotion } = useTheme();
  const [face, setFace] = useState(() => pickFace(kindWord.mood));
  // The kind word the current face was picked for, so coming back to a
  // screen with the same one keeps the same face.
  const faceFor = useRef(kindWord.id);
  const hop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (faceFor.current === kindWord.id) return;
    faceFor.current = kindWord.id;
    setFace((current) => pickFace(kindWord.mood, current));
    if (reduceMotion) return;
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(hop, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [kindWord.id, kindWord.mood, reduceMotion, hop]);

  const translateY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -HOP_HEIGHT] });

  return (
    <View style={styles.area}>
      {children}
      <Animated.View
        style={[styles.pup, { transform: [{ translateY }] }]}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <MascotDrawing face={face} width={WIDTH} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Room above the card for the pup.
  area: {
    width: '100%',
    marginTop: mascotPeek(WIDTH),
  },
  // Its paws rest on the card's edge, clear of the rounded corner.
  pup: {
    position: 'absolute',
    top: -mascotPeek(WIDTH),
    right: 28,
  },
});
