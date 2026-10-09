// A small row of actions that go under a QuoteCard: save/unsave as a
// favorite, and share it as an image. Kept separate from QuoteCard itself
// so the card stays exactly what gets captured when sharing.

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../data/worlds';

type Props = {
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  // Only the Kind word detail screen offers snoozing, so this stays
  // optional and Home/Favorites keep showing just the two buttons.
  onSnooze?: () => void;
};

export default function QuoteActions({ isFavorite, onToggleFavorite, onShare, onSnooze }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggleFavorite}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        accessibilityState={{ selected: isFavorite }}
      >
        <Text style={[styles.icon, isFavorite && styles.iconActive]}>
          {isFavorite ? '♥' : '♡'}
        </Text>
        <Text style={styles.label}>{isFavorite ? 'Saved' : 'Save'}</Text>
      </Pressable>

      <Pressable
        onPress={onShare}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Share this quote as an image"
      >
        <Text style={styles.icon}>⤴</Text>
        <Text style={styles.label}>Share</Text>
      </Pressable>

      {onSnooze && (
        <Pressable
          onPress={onSnooze}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Snooze kind words or hide this quote"
        >
          <Text style={styles.icon}>⏰</Text>
          <Text style={styles.label}>Snooze</Text>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 18,
    },
    icon: {
      fontSize: 18,
      color: colors.mutedText,
      marginRight: 6,
    },
    iconActive: {
      color: colors.accent,
    },
    label: {
      fontSize: 14,
      color: colors.secondaryText,
      fontWeight: '600',
    },
  });
}
