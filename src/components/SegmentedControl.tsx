// A row of options where exactly one is selected at a time, e.g. picking a
// notification frequency or a lock-screen visibility mode.

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../data/worlds';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export default function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.segment, value === opt.value && styles.segmentSelected]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.segmentText, value === opt.value && styles.segmentTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.chipSelectedBackground,
      borderRadius: 14,
      padding: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    segmentSelected: {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 1,
    },
    segmentText: {
      fontSize: 13,
      color: colors.mutedText,
    },
    segmentTextSelected: {
      color: colors.primaryText,
      fontWeight: '700',
    },
  });
}
