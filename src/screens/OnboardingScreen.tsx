// First screen a new user sees. Lets them pick one or more circumstances
// so later screens can show quotes that feel relevant to their life.

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CIRCUMSTANCES } from '../data/circumstances';
import { setCircumstances, setOnboardingDone } from '../services/storage';
import CircumstanceChip from '../components/CircumstanceChip';
import WorldBackground from '../components/WorldBackground';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';

type Props = {
  onDone: () => void;
};

export default function OnboardingScreen({ onDone }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const { world } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(world), [world]);

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
      <WorldBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('onboarding.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

        <View style={styles.chipRow}>
          {CIRCUMSTANCES.map((c) => (
            <CircumstanceChip
              key={c.id}
              label={t(`circumstances.${c.id}`)}
              emoji={c.emoji}
              selected={selected.includes(c.id)}
              onPress={() => toggle(c.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(world: World) {
  const { colors } = world;
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
      color: colors.primaryText,
      marginBottom: 12,
      textAlign: 'center',
      ...headingFont(world),
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
      ...headingFont(world),
    },
  });
}
