// A calm, pretty card for displaying a single quote (or a personal note,
// which has the same text + author shape). Kept purely about display (no
// favorite/share controls) so a picture of it is just the card.
//
// No quotation marks around the text: besides the app's kind words (which
// have no author), the card carries the user's own words and notes from
// loved ones, and marks would make those read like quoting someone else.

import React, { Ref, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Quote } from '../services/quotes';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { bodyFont } from '../theme/fontStyle';
import WorldFrame from './WorldFrame';

type Props = {
  quote: Pick<Quote, 'text' | 'author'>;
  // Draws the card the way it's sent as a picture: inside a frame of its
  // world (see WorldFrame). On screen the card already sits in its world,
  // so only pictures and their preview use this.
  framed?: boolean;
  // True only while a picture is being taken (see useCardShare).
  capturing?: boolean;
  // The view a share captures. Since React 19, `ref` can be passed to a
  // function component like any other prop.
  ref?: Ref<View>;
};

export default function QuoteCard({ quote, framed = false, capturing = false, ref }: Props) {
  const { world } = useTheme();
  const styles = useMemo(() => createStyles(world), [world]);

  return (
    // A framed card's corners are rounded on screen like everything else,
    // but square while the picture is taken, since many apps (WhatsApp, for
    // one) show a PNG's see-through corners as black.
    <View
      ref={ref}
      collapsable={false}
      style={framed ? [styles.frame, capturing && styles.frameCapturing] : styles.wrapper}
    >
      {framed && <WorldFrame />}
      <View style={styles.card}>
        <Text style={styles.text}>{quote.text}</Text>
        {quote.author ? <Text style={styles.author}>— {quote.author}</Text> : null}
      </View>
    </View>
  );
}

function createStyles(world: World) {
  const { colors, card } = world;
  return StyleSheet.create({
    wrapper: {
      width: '100%',
    },
    frame: {
      width: '100%',
      // Room around the card for the world's decorations.
      paddingHorizontal: 28,
      paddingVertical: 30,
      // Simple has no gradient, so its frame is just its plain background.
      backgroundColor: colors.background,
      borderRadius: 20,
      // Decorations that run past the edge are cut off there.
      overflow: 'hidden',
    },
    frameCapturing: {
      borderRadius: 0,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: card.borderRadius,
      borderWidth: card.borderWidth,
      borderColor: card.borderColor,
      paddingVertical: 36,
      paddingHorizontal: 28,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: card.shadowOpacity,
      shadowRadius: 12,
      elevation: card.elevation,
      alignItems: 'center',
    },
    text: {
      fontSize: 20,
      lineHeight: 30,
      textAlign: 'center',
      color: colors.primaryText,
      fontWeight: world.fonts.body ? undefined : '500',
      ...bodyFont(world),
    },
    author: {
      marginTop: 16,
      fontSize: 14,
      color: colors.mutedText,
      ...bodyFont(world),
    },
  });
}
