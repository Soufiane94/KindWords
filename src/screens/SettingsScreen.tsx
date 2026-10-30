// Settings screen: circumstances (Phase 1), appearance ("A new look each
// day", which replaced choosing a world, and the plain font from 9C),
// languages (Phase 6), personal touches (Phase 7): the daily check-in and
// undoing "not for me" — then the reminders (Phase 2, in
// ReminderSettingsForm since the welcome shares them in 9O) with their Save
// button, and, at the bottom, quiet links to help pages (9C on).

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CIRCUMSTANCES } from '../data/circumstances';
import { LANGUAGE_OPTIONS, Language } from '../data/languages';
import i18n, { useUiLanguage } from '../i18n';
import {
  getCircumstances,
  setCircumstances,
  getNotificationSettings,
  setNotificationSettings,
  getUiLanguage,
  setUiLanguage,
  getQuoteLanguage,
  setQuoteLanguage,
  getCheckInEnabled,
  setCheckInEnabled,
  clearTodayCheckIn,
  forgetNotForMe,
  tidyNotificationSettings,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../services/storage';
import { describePausedUntil, rescheduleAllNotifications, RescheduleResult } from '../services/notifications';
import { regularTimes } from '../services/reminderPlan';
import { refreshKindWordWidget } from '../widget/widgetTaskHandler';
import CircumstanceChip from '../components/CircumstanceChip';
import ReminderSettingsForm from '../components/ReminderSettingsForm';
import WorldBackground from '../components/WorldBackground';
import { useTheme } from '../theme/ThemeContext';
import { formatMomentDisplay, formatTimeDisplay } from '../i18n/dateNames';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';
import type { RootStackParamList } from '../navigation/types';

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saved'; lines: string[]; skippedTimes: string[] }
  | { kind: 'permission_denied' };

type Props = {
  // Like an Angular @Output(): SettingsScreen doesn't know what happens
  // after reset, it just tells the parent (RootNavigator) that it should.
  onResetOnboarding: () => void;
};

export default function SettingsScreen({ onResetOnboarding }: Props) {
  const [selectedCircumstances, setSelectedCircumstances] = useState<string[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [uiLanguage, setUiLanguageState] = useState<Language>('en');
  const [quoteLanguage, setQuoteLanguageState] = useState<Language>('en');
  const [checkInEnabled, setCheckInEnabledState] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });
  const { world, colors, dailyWorld, setDailyWorld, plainFont, setPlainFont } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const language = useUiLanguage();
  const styles = useMemo(() => createStyles(world), [world]);

  useFocusEffect(
    useCallback(() => {
      getCircumstances().then(setSelectedCircumstances);
      getNotificationSettings().then(setSettings);
      getUiLanguage().then(setUiLanguageState);
      getQuoteLanguage().then(setQuoteLanguageState);
      getCheckInEnabled().then(setCheckInEnabledState);
      setSaveStatus({ kind: 'idle' });
    }, [])
  );

  async function toggleCircumstance(id: string) {
    const next = selectedCircumstances.includes(id)
      ? selectedCircumstances.filter((x) => x !== id)
      : [...selectedCircumstances, id];
    const safeNext = next.length > 0 ? next : ['other'];
    setSelectedCircumstances(safeNext);
    await setCircumstances(safeNext);
  }

  // The home screen widget shows the world's colors and font and the chosen
  // languages, so it's redrawn whenever one of those changes (once saved,
  // since it reads them from storage).
  async function handleDailyWorldChange(on: boolean) {
    await setDailyWorld(on);
    refreshKindWordWidget();
  }

  async function handlePlainFontChange(on: boolean) {
    await setPlainFont(on);
    refreshKindWordWidget();
  }

  async function handleUiLanguageChange(next: Language) {
    setUiLanguageState(next);
    await setUiLanguage(next);
    await i18n.changeLanguage(next);
    refreshKindWordWidget();
  }

  async function handleQuoteLanguageChange(next: Language) {
    setQuoteLanguageState(next);
    await setQuoteLanguage(next);
    refreshKindWordWidget();
  }

  async function handleCheckInToggle(enabled: boolean) {
    setCheckInEnabledState(enabled);
    await setCheckInEnabled(enabled);
    // Turning it off also forgets today's answer, so it stops shaping
    // which kind words get picked straight away.
    if (!enabled) await clearTodayCheckIn();
  }

  function handleForgetNotForMe() {
    Alert.alert(t('settings.forgetNotForMeConfirmTitle'), t('settings.forgetNotForMeConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.forgetNotForMeButton'),
        onPress: async () => {
          await forgetNotForMe();
          rescheduleAllNotifications().catch(() => {});
          Alert.alert(t('settings.forgetNotForMeDone'));
        },
      },
    ]);
  }

  // A plain-language summary of what saving set up ("A kind word every day
  // at 9:00 AM", the next one, any event reminders...) rather than one raw
  // count that mixed repeating and one-off reminders together.
  function describeSchedule(
    saved: NotificationSettings,
    result: Extract<RescheduleResult, { status: 'scheduled' }>
  ): string[] {
    const lines: string[] = [];
    const sentTimes = regularTimes(saved)
      .filter((time) => !result.skippedTimes.includes(time))
      .map((time) => formatTimeDisplay(time, language));

    if (sentTimes.length === 0) {
      lines.push(t('settings.summaryNoTimes'));
    } else if (saved.frequency === 'daily') {
      lines.push(t('settings.summaryDaily', { time: sentTimes[0] }));
    } else if (saved.frequency === 'three_per_week') {
      lines.push(t('settings.summaryThreePerWeek', { time: sentTimes[0] }));
    } else {
      lines.push(t('settings.summaryCustom', { times: sentTimes.join(', ') }));
    }

    if (result.pausedUntil) lines.push(describePausedUntil(result.pausedUntil));
    if (result.eventReminderCount > 0) {
      lines.push(
        t(result.eventReminderCount === 1 ? 'settings.eventRemindersOne' : 'settings.eventRemindersOther', {
          count: result.eventReminderCount,
        })
      );
    }
    if (result.futureNoteCount > 0) {
      lines.push(
        t(result.futureNoteCount === 1 ? 'settings.futureNotesOne' : 'settings.futureNotesOther', {
          count: result.futureNoteCount,
        })
      );
    }
    if (result.forSomeoneCount > 0) {
      lines.push(
        t(result.forSomeoneCount === 1 ? 'settings.forSomeoneOne' : 'settings.forSomeoneOther', {
          count: result.forSomeoneCount,
        })
      );
    }
    if (result.nextAt) {
      lines.push(t('settings.nextAt', { when: formatMomentDisplay(new Date(result.nextAt), language) }));
    }
    return lines;
  }

  async function handleSave() {
    const cleaned = tidyNotificationSettings(settings);
    setSettings(cleaned);
    await setNotificationSettings(cleaned);

    const result = await rescheduleAllNotifications({ askPermission: true });

    if (result.status === 'permission_denied') {
      setSaveStatus({ kind: 'permission_denied' });
      setSettings({ ...cleaned, enabled: false });
      await setNotificationSettings({ ...cleaned, enabled: false });
      return;
    }
    if (result.status === 'off') {
      setSaveStatus({ kind: 'saved', lines: [t('settings.savedOff')], skippedTimes: [] });
      return;
    }
    setSaveStatus({
      kind: 'saved',
      lines: describeSchedule(cleaned, result),
      skippedTimes: result.skippedTimes.map((time) => formatTimeDisplay(time, language)),
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {t('settings.title')}
        </Text>

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('settings.circumstancesTitle')}
        </Text>
        <Text style={styles.subtitle}>{t('settings.circumstancesSubtitle')}</Text>
        <View style={styles.chipRow}>
          {CIRCUMSTANCES.map((c) => (
            <CircumstanceChip
              key={c.id}
              label={t(`circumstances.${c.id}`)}
              emoji={c.emoji}
              selected={selectedCircumstances.includes(c.id)}
              onPress={() => toggleCircumstance(c.id)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('settings.appearanceTitle')}
        </Text>
        <View style={[styles.rowBetween, { marginTop: 12, marginBottom: 0 }]}>
          <Text style={styles.toggleLabel}>{t('settings.dailyWorldLabel')}</Text>
          <Switch
            value={dailyWorld}
            onValueChange={handleDailyWorldChange}
            trackColor={{ true: colors.accent }}
            accessibilityLabel={t('settings.dailyWorldLabel')}
          />
        </View>
        <Text style={styles.subtitle}>{t('settings.dailyWorldSubtitle')}</Text>
        <View style={[styles.rowBetween, { marginTop: 8, marginBottom: 0 }]}>
          <Text style={styles.toggleLabel}>{t('settings.plainFontLabel')}</Text>
          <Switch
            value={plainFont}
            onValueChange={handlePlainFontChange}
            trackColor={{ true: colors.accent }}
            accessibilityLabel={t('settings.plainFontLabel')}
          />
        </View>
        <Text style={styles.subtitle}>{t('settings.plainFontSubtitle')}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('settings.languageTitle')}
        </Text>
        <Text style={styles.label}>{t('settings.uiLanguageLabel')}</Text>
        <Text style={styles.subtitle}>{t('settings.uiLanguageSubtitle')}</Text>
        <View style={styles.chipRow}>
          {LANGUAGE_OPTIONS.map((l) => (
            <CircumstanceChip
              key={l.id}
              label={l.label}
              emoji={l.emoji}
              selected={uiLanguage === l.id}
              onPress={() => handleUiLanguageChange(l.id)}
            />
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>{t('settings.quoteLanguageLabel')}</Text>
        <Text style={styles.subtitle}>{t('settings.quoteLanguageSubtitle')}</Text>
        <View style={styles.chipRow}>
          {LANGUAGE_OPTIONS.map((l) => (
            <CircumstanceChip
              key={l.id}
              label={l.label}
              emoji={l.emoji}
              selected={quoteLanguage === l.id}
              onPress={() => handleQuoteLanguageChange(l.id)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('settings.personalTitle')}
        </Text>
        <View style={[styles.rowBetween, { marginTop: 12, marginBottom: 0 }]}>
          <Text style={styles.toggleLabel}>{t('settings.checkInLabel')}</Text>
          <Switch
            value={checkInEnabled}
            onValueChange={handleCheckInToggle}
            trackColor={{ true: colors.accent }}
            accessibilityLabel={t('settings.checkInLabel')}
          />
        </View>
        <Text style={styles.subtitle}>{t('settings.checkInSubtitle')}</Text>
        <Pressable onPress={handleForgetNotForMe} style={styles.inlineLink} accessibilityRole="button">
          <Text style={styles.inlineLinkText}>{t('settings.forgetNotForMe')}</Text>
        </Pressable>

        <View style={styles.divider} />

        <ReminderSettingsForm settings={settings} onChange={setSettings} />

        <Pressable style={styles.saveButton} onPress={handleSave} accessibilityRole="button">
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </Pressable>

        {saveStatus.kind === 'saved' && (
          <View style={styles.statusBox}>
            {saveStatus.lines.map((line) => (
              <Text key={line} style={styles.statusText}>
                {line}
              </Text>
            ))}
            {saveStatus.skippedTimes.length > 0 && (
              <Text style={styles.statusWarning}>
                {t('settings.skippedTimes', { times: saveStatus.skippedTimes.join(', ') })}
              </Text>
            )}
          </View>
        )}

        {saveStatus.kind === 'permission_denied' && (
          <View style={styles.statusBox}>
            <Text style={styles.statusWarning}>{t('settings.permissionDenied')}</Text>
          </View>
        )}

        {/* Android phones may hold kind words back to save battery (9G). */}
        {Platform.OS === 'android' && settings.enabled && (
          <Pressable
            onPress={() => navigation.navigate('DeliveryHelp')}
            style={styles.lateLink}
            accessibilityRole="button"
          >
            <Text style={styles.inlineLinkText}>{t('settings.deliveryHelpLink')}</Text>
          </Pressable>
        )}

        <View style={styles.divider} />

        {/* Quiet links to pages that are there when they're needed. */}
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('settings.helpTitle')}
        </Text>
        <Pressable onPress={() => navigation.navigate('Support')} style={styles.helpLink} accessibilityRole="button">
          <Text style={styles.helpLinkText}>{t('settings.supportLink')}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Privacy')} style={styles.helpLink} accessibilityRole="button">
          <Text style={styles.helpLinkText}>{t('settings.privacyLink')}</Text>
        </Pressable>
        {Platform.OS === 'android' && (
          <Pressable
            onPress={() => navigation.navigate('DeliveryHelp')}
            style={styles.helpLink}
            accessibilityRole="button"
          >
            <Text style={styles.helpLinkText}>{t('settings.deliveryHelpLink')}</Text>
          </Pressable>
        )}

        <Pressable onPress={onResetOnboarding} style={styles.resetLink} accessibilityRole="button">
          <Text style={styles.resetLinkText}>{t('settings.resetOnboarding')}</Text>
        </Pressable>
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
    content: {
      padding: 24,
      paddingTop: 32,
      paddingBottom: 48,
    },
    title: {
      fontSize: 24,
      color: colors.primaryText,
      marginBottom: 20,
      ...headingFont(world),
    },
    sectionTitle: {
      fontSize: 17,
      color: colors.primaryText,
      ...headingFont(world),
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 4,
      marginBottom: 12,
      lineHeight: 19,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 24,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 8,
    },
    toggleLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginRight: 12,
    },
    inlineLink: {
      alignSelf: 'flex-start',
    },
    inlineLinkText: {
      fontSize: 13,
      color: colors.secondaryText,
      textDecorationLine: 'underline',
    },
    saveButton: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 28,
    },
    saveButtonText: {
      color: colors.accentText,
      fontSize: 16,
      ...headingFont(world),
    },
    statusBox: {
      marginTop: 16,
    },
    statusText: {
      fontSize: 13,
      color: colors.success,
      textAlign: 'center',
      marginTop: 2,
    },
    statusWarning: {
      fontSize: 13,
      color: colors.danger,
      textAlign: 'center',
      marginTop: 4,
    },
    helpLink: {
      alignSelf: 'flex-start',
      paddingVertical: 8,
      marginTop: 4,
    },
    lateLink: {
      alignSelf: 'center',
      paddingVertical: 6,
      marginTop: 12,
    },
    helpLinkText: {
      fontSize: 15,
      color: colors.primaryText,
      textDecorationLine: 'underline',
    },
    resetLink: {
      marginTop: 32,
      alignItems: 'center',
    },
    resetLinkText: {
      fontSize: 13,
      color: colors.mutedText,
      textDecorationLine: 'underline',
    },
  });
}
