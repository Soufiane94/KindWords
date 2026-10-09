// A calm, pretty card for displaying a single quote. Kept purely about
// display (no favorite/share controls) so this is exactly what gets
// captured when someone shares a quote as an image.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Quote } from '../services/quotes';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { bodyFont } from '../theme/fontStyle';

type Props = {
  quote: Quote;
};

export default function QuoteCard({ quote }: Props) {
  const { world } = useTheme();
  const styles = useMemo(() => createStyles(world), [world]);

  return (
    <View style={styles.card}>
      <Text style={styles.quoteMark}>“</Text>
      <Text style={styles.text}>{quote.text}</Text>
      {quote.author ? <Text style={styles.author}>— {quote.author}</Text> : null}
    </View>
  );
}

function createStyles(world: World) {
  const { colors, card } = world;
  return StyleSheet.create({
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
