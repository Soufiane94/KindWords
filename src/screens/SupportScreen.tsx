// "Need to talk to someone?" (9C): a quiet, optional page of listening
// lines by country, opened from Settings or from the small line under a
// "Heavy" check-in, never as a pop-up. Nothing about opening it is stored.
// Tapping a number only opens the phone app with it filled in, so calling
// stays the user's choice.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import WorldBackground from '../components/WorldBackground';
import { orderedSupportCountries, SupportLine } from '../data/supportLines';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Support'>;

function openLine(line: SupportLine) {
  const target = line.phone ? `tel:${line.phone.replace(/\s/g, '')}` : line.url;
  // If the phone can't open it (a tablet with no phone app, say), the
  // number is still right there on screen.
  if (target) Linking.openURL(target).catch(() => {});
}

export default function SupportScreen({ navigation }: Props) {
  const { world, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(world), [world]);
  // The phone's own country comes first. Read here only, never stored.
  const countries = useMemo(() => orderedSupportCountries(Localization.getLocales()[0]?.regionCode), []);

  function renderLine(line: SupportLine) {
    const description = t(`support.lines.${line.id}.description`);
    // A website shows its address where a phone line shows its hours.
    const meta = line.phone ? t(`support.lines.${line.id}.hours`) : (line.url ?? '').replace(/^https:\/\//, '');
    const showNumber = line.phone !== undefined && line.phone !== line.name;
    return (
      <Pressable
        key={line.id}
        onPress={() => openLine(line)}
        style={styles.card}
        accessibilityRole={line.phone ? 'button' : 'link'}
        accessibilityLabel={[line.name, showNumber ? line.phone : null, description, meta].filter(Boolean).join('. ')}
        accessibilityHint={t(line.phone ? 'support.callHint' : 'support.siteHint')}
      >
        <View style={styles.cardText}>
          <Text style={styles.lineName}>{line.name}</Text>
          {showNumber && <Text style={styles.lineNumber}>{line.phone}</Text>}
          <Text style={styles.lineDescription}>{description}</Text>
          <Text style={styles.lineMeta}>{meta}</Text>
        </View>
        <Ionicons name={line.phone ? 'call-outline' : 'open-outline'} size={22} color={colors.secondaryText} />
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('support.title')}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={styles.closeButton}
          hitSlop={8}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>{t('support.intro')}</Text>

        {countries.map((country) => (
          <View key={country.id} style={styles.country}>
            <Text
              style={styles.countryName}
              accessibilityRole="header"
              accessibilityLabel={t(`support.countries.${country.id}`)}
            >
              {`${country.flag} ${t(`support.countries.${country.id}`)}`}
            </Text>
            {country.lines.map(renderLine)}
            {country.emergency.length > 0 && (
              <View style={styles.emergencyRow}>
                <Text style={styles.emergencyLabel}>{t('support.emergencyLabel')}</Text>
                {country.emergency.map((line) => (
                  <Pressable
                    key={line.id}
                    onPress={() => openLine(line)}
                    style={styles.emergencyButton}
                    accessibilityRole="button"
                    accessibilityLabel={`${line.name}, ${t(`support.lines.${line.id}.description`)}`}
                    accessibilityHint={t('support.callHint')}
                  >
                    <Text style={styles.emergencyText}>
                      {line.name} · {t(`support.lines.${line.id}.description`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}

        <Text style={styles.footer}>{t('support.footer')}</Text>
      </ScrollView>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    headerTitle: {
      flexShrink: 1,
      fontSize: 17,
      color: colors.primaryText,
      ...headingFont(world),
    },
    closeButton: {
      padding: 6,
      marginLeft: 12,
    },
    closeText: {
      fontSize: 20,
      color: colors.mutedText,
    },
    content: {
      padding: 24,
      paddingTop: 12,
      paddingBottom: 40,
    },
    intro: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.secondaryText,
      marginBottom: 8,
    },
    country: {
      marginTop: 20,
    },
    countryName: {
      fontSize: 16,
      color: colors.primaryText,
      marginBottom: 10,
      ...headingFont(world),
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 10,
    },
    cardText: {
      flex: 1,
      marginRight: 12,
    },
    lineName: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.primaryText,
    },
    lineNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginTop: 2,
    },
    lineDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.secondaryText,
      marginTop: 4,
    },
    lineMeta: {
      fontSize: 13,
      color: colors.mutedText,
      marginTop: 4,
    },
    emergencyRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginTop: 2,
    },
    emergencyLabel: {
      fontSize: 13,
      color: colors.secondaryText,
      marginRight: 6,
    },
    emergencyButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.chipSelectedBackground,
      marginRight: 8,
      marginVertical: 4,
    },
    emergencyText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryText,
    },
    footer: {
      fontSize: 12,
      color: colors.mutedText,
      textAlign: 'center',
      marginTop: 28,
    },
  });
}
