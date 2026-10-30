// "If kind words arrive late" (9G, Android only). Some phones hold back an
// app's notifications to save battery, and since Android 14 an app may only
// set exact alarms once the user allows it in "Alarms & reminders". This
// page explains both gently, with buttons straight to the right settings.
// Every step is optional: Wafi keeps working without any of them, kind
// words may just come a little late.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as IntentLauncher from 'expo-intent-launcher';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import WorldBackground from '../components/WorldBackground';
import { ANDROID_PACKAGE, BACKGROUND_GUIDES_URL } from '../data/links';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DeliveryHelp'>;

// "Alarms & reminders" exists from Android 12 (API level 31).
const HAS_EXACT_ALARM_SETTING = Platform.OS === 'android' && Number(Platform.Version) >= 31;

const BRANDS = ['samsung', 'xiaomi', 'huawei', 'other'] as const;

// Opens a system settings page. If a phone doesn't have that exact page,
// the app's own settings page is the next best place.
function openSettings(action: IntentLauncher.ActivityAction, params: IntentLauncher.IntentLauncherParams) {
  IntentLauncher.startActivityAsync(action, params).catch(() => Linking.openSettings().catch(() => {}));
}

export default function DeliveryHelpScreen({ navigation }: Props) {
  const { world } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(world), [world]);

  // Each point: a short title, a sentence or two, and the button to the
  // setting it talks about.
  const points = [
    ...(HAS_EXACT_ALARM_SETTING
      ? [
          {
            key: 'exact',
            onPress: () =>
              openSettings(IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM, {
                data: `package:${ANDROID_PACKAGE}`,
              }),
          },
        ]
      : []),
    {
      key: 'battery',
      onPress: () =>
        openSettings(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
          data: `package:${ANDROID_PACKAGE}`,
        }),
    },
    {
      key: 'notifications',
      onPress: () =>
        openSettings(IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS, {
          extra: { 'android.provider.extra.APP_PACKAGE': ANDROID_PACKAGE },
        }),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('deliveryHelp.title')}
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
        <Text style={styles.intro}>{t('deliveryHelp.intro')}</Text>

        {points.map(({ key, onPress }) => (
          <View key={key} style={styles.point}>
            <Text style={styles.pointTitle} accessibilityRole="header">
              {t(`deliveryHelp.${key}Title`)}
            </Text>
            <Text style={styles.body}>{t(`deliveryHelp.${key}Body`)}</Text>
            <Pressable onPress={onPress} style={styles.button} accessibilityRole="button">
              <Text style={styles.buttonText}>{t(`deliveryHelp.${key}Button`)}</Text>
            </Pressable>
          </View>
        ))}

        <Text style={styles.pointTitle} accessibilityRole="header">
          {t('deliveryHelp.brandsTitle')}
        </Text>
        {BRANDS.map((brand) => (
          <Text key={brand} style={[styles.body, styles.brand]}>
            {t(`deliveryHelp.brands.${brand}`)}
          </Text>
        ))}
        <Pressable
          onPress={() => Linking.openURL(BACKGROUND_GUIDES_URL).catch(() => {})}
          accessibilityRole="link"
          style={styles.link}
        >
          <Text style={styles.linkText}>{t('deliveryHelp.guidesLink')}</Text>
        </Pressable>

        <Text style={styles.footer}>{t('deliveryHelp.footer')}</Text>
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
      marginBottom: 20,
    },
    point: {
      marginBottom: 24,
    },
    pointTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 4,
    },
    body: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.secondaryText,
    },
    button: {
      alignSelf: 'flex-start',
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginTop: 10,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
    },
    brand: {
      marginTop: 8,
    },
    link: {
      alignSelf: 'flex-start',
      paddingVertical: 8,
      marginTop: 4,
    },
    linkText: {
      fontSize: 14,
      color: colors.primaryText,
      textDecorationLine: 'underline',
    },
    footer: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.mutedText,
      textAlign: 'center',
      marginTop: 28,
    },
  });
}
