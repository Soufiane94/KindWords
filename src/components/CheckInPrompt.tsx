// The optional daily check-in on Home (Phase 7): one tap for how today
// feels, only used to pick a kind word that fits a little better. Before
// it's answered it shows the question; after, just a small line with the
// answer and a way to change it. "Not now" skips it for the rest of the day,
// and it can be turned off completely in Settings.

import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CHECK_IN_OPTIONS, CheckInMood } from '../data/checkIn';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../data/worlds';

type Props = {
  mood: CheckInMood | null; // today's answer, or null if not answered yet
  onAnswer: (mood: CheckInMood) => void;
  onNotNow: () => void;
};

export default function CheckInPrompt({ mood, onAnswer, onNotNow }: Props) {
  const [changing, setChanging] = useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const answered = CHECK_IN_OPTIONS.find((option) => option.id === mood);

  if (answered && !changing) {
    return (
      <View style={styles.answeredRow}>
        <Text style={styles.answeredText}>
          {t('checkIn.today', { mood: `${answered.emoji} ${t(`checkIn.moods.${answered.id}`)}` })}
        </Text>
        <Pressable onPress={() => setChanging(true)} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.link}>{t('checkIn.change')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.question}>{t('checkIn.question')}</Text>
      <View style={styles.options}>
        {CHECK_IN_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            style={[styles.option, option.id === mood && styles.optionSelected]}
            onPress={() => {
              setChanging(false);
              onAnswer(option.id);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: option.id === mood }}
          >
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <Text style={styles.optionLabel} numberOfLines={1}>
              {t(`checkIn.moods.${option.id}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.privacy}>{t('checkIn.privacy')}</Text>
        <Pressable
          onPress={answered ? () => setChanging(false) : onNotNow}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.link}>{answered ? t('common.cancel') : t('checkIn.notNow')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    box: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 24,
    },
    question: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryText,
      textAlign: 'center',
      marginBottom: 10,
    },
    options: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    option: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      marginHorizontal: 2,
      borderRadius: 12,
    },
    optionSelected: {
      backgroundColor: colors.chipSelectedBackground,
    },
    optionEmoji: {
      fontSize: 22,
    },
    optionLabel: {
      marginTop: 4,
      fontSize: 11,
      color: colors.secondaryText,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    privacy: {
      flex: 1,
      fontSize: 11,
      color: colors.mutedText,
      marginRight: 12,
    },
    link: {
      fontSize: 13,
      color: colors.secondaryText,
      textDecorationLine: 'underline',
    },
    answeredRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    answeredText: {
      fontSize: 13,
      color: colors.secondaryText,
      marginRight: 8,
    },
  });
}
