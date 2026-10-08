// A selectable "chip" button used in onboarding to pick circumstances.

import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../data/themes';

type Props = {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
};

export default function CircumstanceChip({ label, emoji, selected, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.chipBorder,
      backgroundColor: colors.chipBackground,
      margin: 6,
    },
    chipSelected: {
      backgroundColor: colors.chipSelectedBackground,
      borderColor: colors.chipSelectedBorder,
    },
    emoji: {
      fontSize: 16,
      marginRight: 6,
    },
    label: {
      fontSize: 15,
      color: colors.primaryText,
    },
    labelSelected: {
      fontWeight: '600',
    },
  });
}
