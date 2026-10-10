// A soft inline note for when something on a screen won't happen the way
// the screen suggests — e.g. reminders are switched off in Settings — so
// it's never a silent surprise.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../data/worlds';

export default function Hint({ text }: { text: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.box}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    box: {
      backgroundColor: colors.chipSelectedBackground,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 16,
    },
    text: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.primaryText,
    },
  });
}
