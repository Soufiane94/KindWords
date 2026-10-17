// First screen a new user sees. Lets them pick one or more circumstances
// so later screens can show quotes that feel relevant to their life, and a
// world (9I), which the whole screen turns into as soon as it's tapped.

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CIRCUMSTANCES } from '../data/circumstances';
import { setCircumstances, setOnboardingDone } from '../services/storage';
import { refreshKindWordWidget } from '../widget/widgetTaskHandler';
import CircumstanceChip from '../components/CircumstanceChip';
import WorldBackground from '../components/WorldBackground';
import { useTheme, WORLD_OPTIONS, WorldId } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';

type Props = {
  onDone: () => void;
};

export default function OnboardingScreen({ onDone }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const { world, worldId, setWorldId } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(world), [world]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Saved straight away, like in Settings, so this screen itself is the
  // preview. The widget may already be on the home screen (after "Redo
  // welcome setup"), so it's redrawn too.
  async function handleWorldChange(id: WorldId) {
    await setWorldId(id);
    refreshKindWordWidget();
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
        <Text style={styles.title} accessibilityRole="header">
          {t('onboarding.title')}
        </Text>
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

        <View style={styles.divider} />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('onboarding.worldTitle')}
        </Text>
        <Text style={styles.subtitle}>{t('onboarding.worldSubtitle')}</Text>
        <View style={styles.chipRow}>
          {WORLD_OPTIONS.map((w) => (
            <CircumstanceChip
              key={w.id}
              label={t(`worlds.${w.id}`)}
              emoji={w.emoji}
              selected={worldId === w.id}
              onPress={() => handleWorldChange(w.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleContinue} accessibilityRole="button">
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
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 28,
    },
    sectionTitle: {
      fontSize: 20,
      color: colors.primaryText,
      marginBottom: 12,
      textAlign: 'center',
      ...headingFont(world),
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
