// A calm, pretty card for displaying a single quote (or a personal note,
// which has the same text + author shape). Kept purely about display (no
// favorite/share controls) so this is exactly what gets captured when
// someone shares it as an image.

import React, { Ref, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Quote } from '../services/quotes';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { bodyFont } from '../theme/fontStyle';

type Props = {
  quote: Pick<Quote, 'text' | 'author'>;
  // True only while a share image is being taken (see useCardShare).
  capturing?: boolean;
  // The view a share captures. Since React 19, `ref` can be passed to a
  // function component like any other prop.
  ref?: Ref<View>;
};

export default function QuoteCard({ quote, capturing = false, ref }: Props) {
  const { world } = useTheme();
  const styles = useMemo(() => createStyles(world), [world]);

  return (
    // The outer frame is what a share captures. On screen it stays
    // see-through, so the card's rounded corners sit cleanly on the world's
    // gradient and decorations (a solid frame showed up as square corners
    // in any world with a gradient background). It only gets a solid fill
    // while a picture is being taken, since many apps (WhatsApp, for one)
    // show a PNG's see-through corners as black.
    <View ref={ref} collapsable={false} style={[styles.frame, capturing && styles.frameCapturing]}>
      <View style={styles.card}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.text}>{quote.text}</Text>
        {quote.author ? <Text style={styles.author}>— {quote.author}</Text> : null}
      </View>
    </View>
  );
}

function createStyles(world: World) {
  const { colors, card } = world;
  return StyleSheet.create({
    frame: {
      width: '100%',
    },
    frameCapturing: {
      backgroundColor: colors.background,
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
    quoteMark: {
      fontSize: 48,
      color: colors.quoteMark,
      lineHeight: 48,
      marginBottom: 4,
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
