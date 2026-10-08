// First screen a new user sees. Lets them pick one or more circumstances
// so later screens can show quotes that feel relevant to their life.

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CIRCUMSTANCES } from '../data/circumstances';
import { setCircumstances, setOnboardingDone } from '../services/storage';
import CircumstanceChip from '../components/CircumstanceChip';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../data/themes';

type Props = {
  onDone: () => void;
};

export default function OnboardingScreen({ onDone }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleContinue() {
    // Default to "other" so we can still always find a matching quote.
    const chosen = selected.length > 0 ? selected : ['other'];
    await setCircumstances(chosen);
    await setOnboardingDone(true);
    onDone();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome to Kindwords</Text>
        <Text style={styles.subtitle}>
          Which of these feel like you right now? Pick as many as you like — this
          just helps us choose kinder words for you.
        </Text>

        <View style={styles.chipRow}>
          {CIRCUMSTANCES.map((c) => (
            <CircumstanceChip
              key={c.id}
              label={c.label}
              emoji={c.emoji}
              selected={selected.includes(c.id)}
              onPress={() => toggle(c.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
      paddingTop: 48,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: colors.secondaryText,
      textAlign: 'center',
      marginBottom: 28,
      lineHeight: 22,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    footer: {
      padding: 24,
    },
    button: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
