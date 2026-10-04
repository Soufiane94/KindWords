// A selectable "chip" button used in onboarding to pick circumstances.

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
};

export default function CircumstanceChip({ label, emoji, selected, onPress }: Props) {
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

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D8C9A3',
    backgroundColor: '#FFFFFF',
    margin: 6,
  },
  chipSelected: {
    backgroundColor: '#F4E8C8',
    borderColor: '#C9A94F',
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    fontSize: 15,
    color: '#3A3A3A',
  },
  labelSelected: {
    fontWeight: '600',
  },
});
